package io.ionic.starter;

import android.os.Bundle;
import android.net.Uri;
import android.util.Log;
import android.webkit.DownloadListener;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "BBZCloud-Download";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Setup native download listener after bridge is ready
        this.getBridge().getWebView().postDelayed(() -> {
            setupDownloadListener();
        }, 1000);
    }
    
    private void setupDownloadListener() {
        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                webView.setDownloadListener(new DownloadListener() {
                    @Override
                    public void onDownloadStart(String url, String userAgent, 
                            String contentDisposition, String mimetype, long contentLength) {
                        
                        Log.d(TAG, "Native download detected:");
                        Log.d(TAG, "  URL: " + url);
                        Log.d(TAG, "  Content-Disposition: " + contentDisposition);
                        Log.d(TAG, "  MIME-Type: " + mimetype);
                        Log.d(TAG, "  Content-Length: " + contentLength);
                        
                        // Extract filename from content disposition or URL
                        String filename = extractFilename(contentDisposition, url, mimetype);
                        
                        // Send download info to JavaScript
                        String jsCode = String.format(
                            "if (window.mobileApp && window.mobileApp.postMessage) {" +
                            "  window.mobileApp.postMessage({" +
                            "    detail: {" +
                            "      type: 'download'," +
                            "      url: '%s'," +
                            "      filename: '%s'," +
                            "      mimetype: '%s'," +
                            "      contentLength: %d," +
                            "      userAgent: '%s'," +
                            "      contentDisposition: '%s'," +
                            "      source: 'native'" +
                            "    }" +
                            "  });" +
                            "} else {" +
                            "  console.log('[BBZCloud] mobileApp.postMessage not available for native download');" +
                            "}", 
                            escapeJsString(url),
                            escapeJsString(filename),
                            escapeJsString(mimetype != null ? mimetype : ""),
                            contentLength,
                            escapeJsString(userAgent != null ? userAgent : ""),
                            escapeJsString(contentDisposition != null ? contentDisposition : "")
                        );
                        
                        // Execute JavaScript on the main thread
                        webView.post(() -> {
                            webView.evaluateJavascript(jsCode, null);
                        });
                    }
                });
                
                Log.d(TAG, "Native download listener setup completed");
            } else {
                Log.e(TAG, "WebView is null, cannot setup download listener");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to setup download listener", e);
        }
    }
    
    private String extractFilename(String contentDisposition, String url, String mimetype) {
        // First try to extract from Content-Disposition header
        if (contentDisposition != null && !contentDisposition.isEmpty()) {
            try {
                // Look for filename="..."
                String[] parts = contentDisposition.split(";");
                for (String part : parts) {
                    part = part.trim();
                    if (part.startsWith("filename=")) {
                        String filename = part.substring(9).trim();
                        // Remove quotes if present
                        if (filename.startsWith("\"") && filename.endsWith("\"")) {
                            filename = filename.substring(1, filename.length() - 1);
                        }
                        // URL decode
                        filename = URLDecoder.decode(filename, StandardCharsets.UTF_8.name());
                        if (!filename.isEmpty()) {
                            Log.d(TAG, "Extracted filename from Content-Disposition: " + filename);
                            return filename;
                        }
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Failed to parse Content-Disposition header", e);
            }
        }
        
        // Fallback: extract from URL
        try {
            Uri uri = Uri.parse(url);
            String lastPathSegment = uri.getLastPathSegment();
            if (lastPathSegment != null && !lastPathSegment.isEmpty()) {
                // URL decode
                String filename = URLDecoder.decode(lastPathSegment, StandardCharsets.UTF_8.name());
                Log.d(TAG, "Extracted filename from URL: " + filename);
                return filename;
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to extract filename from URL", e);
        }
        
        // Final fallback: generate filename based on MIME type
        if (mimetype != null) {
            String extension = getExtensionFromMimeType(mimetype);
            Log.d(TAG, "Generated filename from MIME type: download" + extension);
            return "download" + extension;
        }
        
        Log.d(TAG, "Using default filename");
        return "download";
    }
    
    private String getExtensionFromMimeType(String mimetype) {
        switch (mimetype.toLowerCase()) {
            case "application/pdf":
                return ".pdf";
            case "application/msword":
                return ".doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                return ".docx";
            case "application/vnd.ms-excel":
                return ".xls";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                return ".xlsx";
            case "application/vnd.ms-powerpoint":
                return ".ppt";
            case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                return ".pptx";
            case "application/zip":
                return ".zip";
            case "application/x-rar-compressed":
                return ".rar";
            case "image/jpeg":
                return ".jpg";
            case "image/png":
                return ".png";
            case "image/gif":
                return ".gif";
            case "text/plain":
                return ".txt";
            case "text/csv":
                return ".csv";
            default:
                return "";
        }
    }
    
    private String escapeJsString(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                   .replace("'", "\\'")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
}
