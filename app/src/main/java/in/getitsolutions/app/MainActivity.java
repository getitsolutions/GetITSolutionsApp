package in.getitsolutions.app;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.pm.PackageManager;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {
    private WebView web;
    // Staff admin panel – opens inside the app (logins, uploads, location tag, downloads all work here)
    private static final String ADMIN = "https://getitsolutions.in/admin/";
    private static final int REQ_FILE = 41, REQ_LOC = 42;
    private ValueCallback<Uri[]> fileCb;
    private GeolocationPermissions.Callback geoCb;
    private String geoOrigin;

    private static final String AICHAT = "https://getitsolutions.in/ai-chat.html";   // Gia support chat after a ticket (same as the website)
    private static boolean isAdmin(String u) { return u != null && (u.startsWith(ADMIN) || u.equals("https://getitsolutions.in/admin") || u.startsWith(AICHAT)); }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.parseColor("#0B1F3A"));
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F3F6FB"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setGeolocationEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);   // keeps the admin login session
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                String u = r.getUrl().toString();
                if (u.startsWith("file:///android_asset/") || isAdmin(u)) return false;
                openExternal(u);
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            // bill / photo / signed report / licence PDF uploads from the phone
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try {
                    Intent i = p.createIntent();
                    if (p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    startActivityForResult(Intent.createChooser(i, "Choose file"), REQ_FILE);
                } catch (Exception e) {
                    fileCb = null;
                    Toast.makeText(MainActivity.this, "No app found to pick a file", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
            // "Tag my location" on site visit reports – only for our admin panel
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback cb) {
                if (origin == null || !origin.startsWith("https://getitsolutions.in")) { cb.invoke(origin, false, false); return; }
                if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) { cb.invoke(origin, true, false); return; }
                geoCb = cb; geoOrigin = origin;
                requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOC);
            }
        });
        // CSV / report downloads from the admin panel (sent with the login cookie)
        web.setDownloadListener((url, ua, cd, mime, len) -> {
            try {
                if (url == null || !url.startsWith("https://getitsolutions.in/")) { openExternal(url); return; }
                DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
                String cookie = CookieManager.getInstance().getCookie(url);
                if (cookie != null) r.addRequestHeader("Cookie", cookie);
                r.addRequestHeader("User-Agent", ua);
                String name = URLUtil.guessFileName(url, cd, mime);
                r.setTitle(name);
                r.setMimeType(mime);
                r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
                ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(r);
                Toast.makeText(this, "Downloading " + name, Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Download failed", Toast.LENGTH_SHORT).show();
            }
        });
        setContentView(web);
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl("file:///android_asset/index.html");
    }

    private void openExternal(String url) {
        try {
            Intent i;
            if (url.startsWith("tel:")) i = new Intent(Intent.ACTION_DIAL, Uri.parse(url));
            else if (url.startsWith("mailto:")) i = new Intent(Intent.ACTION_SENDTO, Uri.parse(url));
            else i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(i);
        } catch (Exception e) {
            Toast.makeText(this, "No app found to open this", Toast.LENGTH_SHORT).show();
        }
    }

    class Bridge {
        // Fetches data from getitsolutions.in only (e.g. events.php) and hands the text to a JS callback.
        @JavascriptInterface public void get(final String url, final String cb) {
            if (url == null || !url.startsWith("https://getitsolutions.in/") || cb == null || !cb.matches("[A-Za-z_][A-Za-z0-9_]*")) return;
            new Thread(() -> {
                String body = null;
                HttpURLConnection c = null;
                try {
                    c = (HttpURLConnection) new URL(url).openConnection();
                    c.setConnectTimeout(10000);
                    c.setReadTimeout(15000);
                    c.setUseCaches(false);
                    c.setRequestProperty("Accept", "application/json");
                    if (c.getResponseCode() == 200) {
                        InputStream in = c.getInputStream();
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        byte[] buf = new byte[8192];
                        int n;
                        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                        in.close();
                        body = out.toString("UTF-8");
                    }
                } catch (Exception ignored) {
                } finally {
                    if (c != null) c.disconnect();
                }
                final String js = cb + "(" + (body == null ? "null" : JSONObject.quote(body)) + ")";
                runOnUiThread(() -> web.evaluateJavascript(js, null));
            }).start();
        }

        // POSTs JSON to getitsolutions.in only (support.php, feedback.php); returns {"status":..,"body":".."} to a JS callback.
        @JavascriptInterface public void post(final String url, final String json, final String cb) {
            if (url == null || !url.startsWith("https://getitsolutions.in/") || cb == null || !cb.matches("[A-Za-z_][A-Za-z0-9_]*")) return;
            new Thread(() -> {
                int status = 0;
                String body = null;
                HttpURLConnection c = null;
                try {
                    c = (HttpURLConnection) new URL(url).openConnection();
                    c.setConnectTimeout(10000);
                    c.setReadTimeout(20000);
                    c.setRequestMethod("POST");
                    c.setDoOutput(true);
                    c.setRequestProperty("Content-Type", "application/json");
                    c.setRequestProperty("Accept", "application/json");
                    OutputStream os = c.getOutputStream();
                    os.write(json.getBytes("UTF-8"));
                    os.close();
                    status = c.getResponseCode();
                    InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
                    if (in != null) {
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        byte[] buf = new byte[8192];
                        int n;
                        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                        in.close();
                        body = out.toString("UTF-8");
                    }
                } catch (Exception ignored) {
                } finally {
                    if (c != null) c.disconnect();
                }
                String res;
                try {
                    JSONObject o = new JSONObject();
                    o.put("status", status);
                    o.put("body", body == null ? "" : body);
                    res = o.toString();
                } catch (Exception e) {
                    res = "{\"status\":0,\"body\":\"\"}";
                }
                final String js = cb + "(" + JSONObject.quote(res) + ")";
                runOnUiThread(() -> web.evaluateJavascript(js, null));
            }).start();
        }

        @JavascriptInterface public void open(String url) { runOnUiThread(() -> openExternal(url)); }
        // "← Back" on the support chat page: return to the app's home screen
        @JavascriptInterface public void home() { runOnUiThread(() -> web.loadUrl("file:///android_asset/index.html")); }
        @JavascriptInterface public void copy(String text) {
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                cm.setPrimaryClip(ClipData.newPlainText("Case ID", text));
            });
        }
    }

    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    @Override protected void onPause() { super.onPause(); CookieManager.getInstance().flush(); }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != REQ_FILE || fileCb == null) return;
        Uri[] out = null;
        if (res == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int n = data.getClipData().getItemCount();
                out = new Uri[n];
                for (int i = 0; i < n; i++) out[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) out = new Uri[]{data.getData()};
        }
        fileCb.onReceiveValue(out);
        fileCb = null;
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        if (req != REQ_LOC || geoCb == null) return;
        boolean ok = false;
        for (int r : res) if (r == PackageManager.PERMISSION_GRANTED) ok = true;
        geoCb.invoke(geoOrigin, ok, false);
        geoCb = null;
    }

    @Override
    public void onBackPressed() {
        if (isAdmin(web.getUrl())) {   // inside the admin panel: go back page by page, then return to the app
            if (web.canGoBack()) web.goBack();
            else web.loadUrl("file:///android_asset/index.html");
            return;
        }
        web.evaluateJavascript("backHandler()",
            r -> { if (!"1".equals(r)) MainActivity.super.onBackPressed(); });
    }
}
