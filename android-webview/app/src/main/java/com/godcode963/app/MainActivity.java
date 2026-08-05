package com.godcode963.app;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

public class MainActivity extends Activity {

    private static final String TAG = "TesseraLumen";
    private static final String APP_URL = "https://app.963.co.za";
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int STORAGE_PERMISSION_REQUEST = 1002;

    private WebView webView;
    private ValueCallback<Uri[]> fileUploadCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fullscreen immersive
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
        getWindow().setStatusBarColor(0xFF0A0A1A);

        // Splash background
        getWindow().setBackgroundDrawableResource(R.drawable.splash);

        webView = new WebView(this);
        setContentView(webView);

        // WebView settings
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " TesseraLumen/1.0");

        // Cookies
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // JavaScript bridge for blob downloads
        webView.addJavascriptInterface(new DownloadBridge(), "TesseraDownload");

        // Navigation handler
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.contains("payfast.co.za") || url.contains("greenstonelobo.com")) {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    return true;
                }
                return false;
            }
        });

        // File upload handler
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                fileUploadCallback = callback;
                Intent intent = params.createIntent();
                startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                return true;
            }
        });

        // Download handler — intercepts blob: URLs and standard downloads
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition,
                                        String mimeType, long contentLength) {
                Log.d(TAG, "Download: " + url.substring(0, Math.min(60, url.length())));

                if (url.startsWith("blob:")) {
                    // Blob URLs can't be downloaded directly — inject JS to extract base64
                    handleBlobDownload(url);
                } else {
                    // Standard HTTP download via DownloadManager
                    handleHttpDownload(url, contentDisposition, mimeType);
                }
            }
        });

        // Request storage permission on older Android
        requestStoragePermission();

        // Load the app
        webView.loadUrl(APP_URL);
    }

    // ─── BLOB DOWNLOAD (JS Bridge) ──────────────────────────────────────────────

    private void handleBlobDownload(String blobUrl) {
        // Inject JavaScript that fetches the blob, converts to base64, and passes to Java bridge
        String js = "(async function() {" +
            "try {" +
            "  var resp = await fetch('" + blobUrl + "');" +
            "  var blob = await resp.blob();" +
            "  var reader = new FileReader();" +
            "  reader.onloadend = function() {" +
            "    var base64 = reader.result.split(',')[1];" +
            "    var mimeType = blob.type || 'image/jpeg';" +
            "    var filename = 'tessera-lumen-reading-' + Date.now() + '.jpg';" +
            "    window.TesseraDownload.saveBase64(base64, filename, mimeType);" +
            "  };" +
            "  reader.readAsDataURL(blob);" +
            "} catch(e) {" +
            "  window.TesseraDownload.onError(e.message);" +
            "}" +
            "})();";

        webView.evaluateJavascript(js, null);
    }

    // ─── HTTP DOWNLOAD (DownloadManager) ─────────────────────────────────────────

    private void handleHttpDownload(String url, String contentDisposition, String mimeType) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setMimeType(mimeType);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);

            String filename = guessFilename(url, contentDisposition, mimeType);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
            request.setTitle(filename);

            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            dm.enqueue(request);

            Toast.makeText(this, "Downloading: " + filename, Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Log.e(TAG, "Download failed: " + e.getMessage());
            Toast.makeText(this, "Download failed", Toast.LENGTH_SHORT).show();
        }
    }

    private String guessFilename(String url, String contentDisposition, String mimeType) {
        String filename = "tessera-lumen-download";
        if (contentDisposition != null && contentDisposition.contains("filename=")) {
            int idx = contentDisposition.indexOf("filename=") + 9;
            filename = contentDisposition.substring(idx).replace("\"", "").trim();
        } else if (url != null) {
            String path = Uri.parse(url).getLastPathSegment();
            if (path != null && path.contains(".")) filename = path;
        }
        if (!filename.contains(".")) {
            filename += (mimeType != null && mimeType.contains("jpeg")) ? ".jpg" : ".bin";
        }
        return filename;
    }

    // ─── JAVASCRIPT BRIDGE ───────────────────────────────────────────────────────

    class DownloadBridge {
        @JavascriptInterface
        public void saveBase64(String base64Data, String filename, String mimeType) {
            try {
                byte[] data = Base64.decode(base64Data, Base64.DEFAULT);
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) downloadsDir.mkdirs();

                File file = new File(downloadsDir, filename);
                FileOutputStream fos = new FileOutputStream(file);
                fos.write(data);
                fos.flush();
                fos.close();

                Log.d(TAG, "Saved: " + file.getAbsolutePath() + " (" + data.length + " bytes)");

                // Notify user on UI thread
                runOnUiThread(() ->
                    Toast.makeText(MainActivity.this, "Saved to Downloads: " + filename, Toast.LENGTH_LONG).show()
                );

                // Notify media scanner so file appears in gallery/files app
                Intent scanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
                scanIntent.setData(Uri.fromFile(file));
                sendBroadcast(scanIntent);

            } catch (IOException e) {
                Log.e(TAG, "Save failed: " + e.getMessage());
                runOnUiThread(() ->
                    Toast.makeText(MainActivity.this, "Save failed: " + e.getMessage(), Toast.LENGTH_LONG).show()
                );
            }
        }

        @JavascriptInterface
        public void onError(String message) {
            Log.e(TAG, "JS download error: " + message);
            runOnUiThread(() ->
                Toast.makeText(MainActivity.this, "Download error: " + message, Toast.LENGTH_SHORT).show()
            );
        }
    }

    // ─── PERMISSIONS ─────────────────────────────────────────────────────────────

    private void requestStoragePermission() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) { // Android 9 and below
            if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(
                    new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
                    STORAGE_PERMISSION_REQUEST
                );
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == STORAGE_PERMISSION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Storage permission granted");
            } else {
                Log.w(TAG, "Storage permission denied — downloads may fail on this device");
            }
        }
    }

    // ─── LIFECYCLE ───────────────────────────────────────────────────────────────

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST && fileUploadCallback != null) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null) {
                result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            }
            fileUploadCallback.onReceiveValue(result);
            fileUploadCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
