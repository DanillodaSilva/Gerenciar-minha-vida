package com.minharotina.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import android.widget.RemoteViews;

public class HojeWidget extends AppWidgetProvider {

    public static final String ACAO_ALTERNAR = "com.minharotina.app.ALTERNAR";
    static final int CODIGO_ABRIR = 4201;
    static final int CODIGO_ALTERNAR = 4202;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        desenhar(context, manager, ids, WidgetDados.calcular(context));
        manager.notifyAppWidgetViewDataChanged(ids, R.id.hoje_lista);
        WidgetAtualizador.agendar(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!ACAO_ALTERNAR.equals(intent.getAction())) {
            super.onReceive(context, intent);
            return;
        }
        String data = intent.getStringExtra("data");
        String id = intent.getStringExtra("id");
        if (data == null || id == null) return;
        try {
            WidgetDados.gravarPendencia(context, data, id, intent.getStringExtra("tipo"), intent.getBooleanExtra("feito", false));
        } catch (Exception e) {
            Log.w("HojeWidget", "falha ao gravar pendência", e);
            return;
        }
        WidgetDados.atualizarTodos(context);
        WidgetPlugin.avisarPendencias(context);
    }

    static void desenhar(Context c, AppWidgetManager m, int[] ids, WidgetCalculo.Resultado r) {
        PendingIntent abrir = WidgetDados.abrirApp(c, "rotina", CODIGO_ABRIR);
        Intent alternar = new Intent(c, HojeWidget.class).setAction(ACAO_ALTERNAR);
        int mutavel = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0;
        PendingIntent modelo = PendingIntent.getBroadcast(c, CODIGO_ALTERNAR, alternar, PendingIntent.FLAG_UPDATE_CURRENT | mutavel);
        for (int id : ids) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_hoje);
            Intent servico = new Intent(c, HojeWidgetService.class);
            servico.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
            servico.setData(Uri.parse(servico.toUri(Intent.URI_INTENT_SCHEME)));
            v.setRemoteAdapter(R.id.hoje_lista, servico);
            v.setEmptyView(R.id.hoje_lista, R.id.hoje_vazio);
            v.setPendingIntentTemplate(R.id.hoje_lista, modelo);
            v.setOnClickPendingIntent(R.id.hoje_cabecalho, abrir);
            v.setOnClickPendingIntent(R.id.hoje_vazio, abrir);
            if (r.desatualizado) {
                v.setTextViewText(R.id.hoje_cabecalho, c.getString(R.string.widget_hoje_titulo));
                v.setTextViewText(R.id.hoje_vazio, c.getString(R.string.widget_desatualizado));
            } else {
                v.setTextViewText(R.id.hoje_cabecalho, c.getString(R.string.widget_hoje_cabecalho, r.feitosHoje, r.totalHoje));
                v.setTextViewText(R.id.hoje_vazio, c.getString(R.string.widget_hoje_vazio));
            }
            m.updateAppWidget(id, v);
        }
    }
}
