package com.pdfer.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import androidx.annotation.Nullable;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;

/**
 * Нормализует SHARE (SEND / SEND_MULTIPLE) в VIEW с data=URI, чтобы Capacitor {@code App.getLaunchUrl}
 * и {@code appUrlOpen} получали тот же формат, что и при «Открыть в приложении».
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        normalizeIntent(getIntent());
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        normalizeIntent(intent);
        super.onNewIntent(intent);
        setIntent(intent);
    }

    private static void normalizeIntent(@Nullable Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (Intent.ACTION_SEND.equals(action)) {
            Uri stream = getSingleStreamExtra(intent);
            if (stream != null) {
                intent.setData(stream);
                intent.setAction(Intent.ACTION_VIEW);
            }
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action)) {
            ArrayList<Uri> list = getStreamListExtra(intent);
            if (list != null && !list.isEmpty()) {
                intent.setData(list.get(0));
                intent.setAction(Intent.ACTION_VIEW);
            }
        }
    }

    @SuppressWarnings("deprecation")
    private static Uri getSingleStreamExtra(Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri.class);
        }
        return intent.getParcelableExtra(Intent.EXTRA_STREAM);
    }

    @SuppressWarnings("deprecation")
    private static ArrayList<Uri> getStreamListExtra(Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri.class);
        }
        return intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
    }
}
