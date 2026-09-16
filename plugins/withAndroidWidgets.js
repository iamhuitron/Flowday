const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withWidgetsManifest(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const mainApplication = manifestConfig.modResults.manifest.application[0];
    mainApplication.receiver = mainApplication.receiver || [];

    const hasTodayWidget = mainApplication.receiver.some(
      (r) => r.$ && r.$['android:name'] === '.FlowDayTodayWidget'
    );
    if (!hasTodayWidget) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.FlowDayTodayWidget',
          'android:exported': 'true',
          'android:label': 'FlowDay · Bloque Actual',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/flowday_widget_today_info',
            },
          },
        ],
      });
    }

    const hasHabitsWidget = mainApplication.receiver.some(
      (r) => r.$ && r.$['android:name'] === '.FlowDayHabitsWidget'
    );
    if (!hasHabitsWidget) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.FlowDayHabitsWidget',
          'android:exported': 'true',
          'android:label': 'FlowDay · Racha y Hábitos',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/flowday_widget_habits_info',
            },
          },
        ],
      });
    }

    return manifestConfig;
  });
}

function withWidgetsNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const androidResDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');
      const javaDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'iamhuitron',
        'flowday'
      );

      const drawableDir = path.join(androidResDir, 'drawable');
      const layoutDir = path.join(androidResDir, 'layout');
      const xmlDir = path.join(androidResDir, 'xml');
      const valuesDir = path.join(androidResDir, 'values');

      [drawableDir, layoutDir, xmlDir, valuesDir, javaDir].forEach((dir) => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      });

      // 1. Strings
      const stringsXmlPath = path.join(valuesDir, 'strings.xml');
      if (fs.existsSync(stringsXmlPath)) {
        let content = fs.readFileSync(stringsXmlPath, 'utf8');
        if (!content.includes('widget_today_desc')) {
          content = content.replace(
            '</resources>',
            '    <string name="widget_today_desc">Muestra la actividad en curso y la siguiente de FlowDay</string>\n    <string name="widget_habits_desc">Muestra la racha diaria y progreso de hábitos de FlowDay</string>\n</resources>'
          );
          fs.writeFileSync(stringsXmlPath, content, 'utf8');
        }
      }

      // 2. Drawables
      fs.writeFileSync(
        path.join(drawableDir, 'widget_bg.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#141419" />
    <corners android:radius="20dp" />
    <stroke android:width="1.5dp" android:color="#2a2a38" />
</shape>`
      );

      fs.writeFileSync(
        path.join(drawableDir, 'widget_badge_bg.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#231f3d" />
    <corners android:radius="8dp" />
</shape>`
      );

      // 3. XML widget info
      fs.writeFileSync(
        path.join(xmlDir, 'flowday_widget_today_info.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="220dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/flowday_widget_today"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />`
      );

      fs.writeFileSync(
        path.join(xmlDir, 'flowday_widget_habits_info.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="140dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/flowday_widget_habits"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />`
      );

      // 4. Layouts
      fs.writeFileSync(
        path.join(layoutDir, 'flowday_widget_today.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_bg"
    android:orientation="vertical"
    android:padding="16dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center_vertical"
        android:orientation="horizontal">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:background="@drawable/widget_badge_bg"
            android:paddingHorizontal="8dp"
            android:paddingVertical="2dp"
            android:text="AHORA"
            android:textColor="#a78bfa"
            android:textSize="10sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/widget_activity_time"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="end"
            android:text="09:00 - 10:30"
            android:textColor="#888899"
            android:textSize="11sp" />
    </LinearLayout>

    <TextView
        android:id="@+id/widget_activity_name"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:ellipsize="end"
        android:maxLines="1"
        android:text="Bloque de Foco Profundo"
        android:textColor="#ffffff"
        android:textSize="16sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/widget_next_activity"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="10dp"
        android:ellipsize="end"
        android:maxLines="1"
        android:text="Siguiente: Descanso y Café · 10:30"
        android:textColor="#a1a1b5"
        android:textSize="12sp" />
</LinearLayout>`
      );

      fs.writeFileSync(
        path.join(layoutDir, 'flowday_widget_habits.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_habits_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_bg"
    android:gravity="center"
    android:orientation="vertical"
    android:padding="14dp">

    <TextView
        android:id="@+id/widget_streak_text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="🔥 12 DÍAS"
        android:textColor="#fbbf24"
        android:textSize="18sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/widget_habits_ratio"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="6dp"
        android:text="4 / 5 hábitos hoy"
        android:textColor="#4ade80"
        android:textSize="13sp" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="FLOWDAY"
        android:textColor="#55556a"
        android:textSize="10sp"
        android:textStyle="bold" />
</LinearLayout>`
      );

      // 5. Kotlin AppWidgetProvider classes
      fs.writeFileSync(
        path.join(javaDir, 'FlowDayTodayWidget.kt'),
        `package com.iamhuitron.flowday

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject

class FlowDayTodayWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.flowday_widget_today)
            val prefs = context.getSharedPreferences("flowday_widget_prefs", Context.MODE_PRIVATE)
            val rawData = prefs.getString("today_data", null)

            var actName = "Sin actividad en curso"
            var actTime = "Tiempo libre o descanso"
            var nextAct = "Siguiente: Planifica tu día"

            if (!rawData.isNullOrEmpty()) {
                try {
                    val json = JSONObject(rawData)
                    actName = json.optString("name", actName)
                    actTime = json.optString("timeRange", actTime)
                    nextAct = json.optString("next", nextAct)
                } catch (e: Exception) {
                    // Fallback
                }
            }

            views.setTextViewText(R.id.widget_activity_name, actName)
            views.setTextViewText(R.id.widget_activity_time, actTime)
            views.setTextViewText(R.id.widget_next_activity, nextAct)

            val intent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
`
      );

      fs.writeFileSync(
        path.join(javaDir, 'FlowDayHabitsWidget.kt'),
        `package com.iamhuitron.flowday

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject

class FlowDayHabitsWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.flowday_widget_habits)
            val prefs = context.getSharedPreferences("flowday_widget_prefs", Context.MODE_PRIVATE)
            val rawData = prefs.getString("habits_data", null)

            var streak = "🔥 0 DÍAS"
            var ratio = "0 / 0 hábitos hoy"

            if (!rawData.isNullOrEmpty()) {
                try {
                    val json = JSONObject(rawData)
                    val sVal = json.optInt("streak", 0)
                    val done = json.optInt("done", 0)
                    val total = json.optInt("total", 0)
                    streak = "🔥 $sVal DÍAS"
                    ratio = "$done / $total hábitos hoy"
                } catch (e: Exception) {
                    // Fallback
                }
            }

            views.setTextViewText(R.id.widget_streak_text, streak)
            views.setTextViewText(R.id.widget_habits_ratio, ratio)

            val intent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(context, 1, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            views.setOnClickPendingIntent(R.id.widget_habits_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
`
      );

      return modConfig;
    },
  ]);
}

module.exports = function withAndroidWidgets(config) {
  return withWidgetsNativeFiles(withWidgetsManifest(config));
};
