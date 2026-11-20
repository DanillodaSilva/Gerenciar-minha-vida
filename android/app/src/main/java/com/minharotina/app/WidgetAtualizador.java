package com.minharotina.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import java.util.Calendar;

public class WidgetAtualizador extends BroadcastReceiver {

    public static final String ACAO_MEIA_NOITE = "com.minharotina.app.WIDGET_MEIA_NOITE";
    private static final int CODIGO = 4401;

    @Override
    public void onReceive(Context context, Intent intent) {
        String acao = intent.getAction();
        if (ACAO_MEIA_NOITE.equals(acao) || Intent.ACTION_BOOT_COMPLETED.equals(acao) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(acao)) {
            WidgetDados.atualizarTodos(context);
            agendar(context);
        }
    }

    public static void agendar(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(c, WidgetAtualizador.class).setAction(ACAO_MEIA_NOITE);
        PendingIntent pi = PendingIntent.getBroadcast(c, CODIGO, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Calendar quando = Calendar.getInstance();
        quando.add(Calendar.DAY_OF_MONTH, 1);
        quando.set(Calendar.HOUR_OF_DAY, 0);
        quando.set(Calendar.MINUTE, 1);
        quando.set(Calendar.SECOND, 0);
        quando.set(Calendar.MILLISECOND, 0);
        am.setAndAllowWhileIdle(AlarmManager.RTC, quando.getTimeInMillis(), pi);
    }
}
