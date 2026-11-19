package com.minharotina.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;

public class ArvoreWidget extends AppWidgetProvider {

    static final int CODIGO_ABRIR = 4101;
    private static final int[] ESTAGIOS = {
        R.drawable.arvore_estagio_0, R.drawable.arvore_estagio_1, R.drawable.arvore_estagio_2,
        R.drawable.arvore_estagio_3, R.drawable.arvore_estagio_4, R.drawable.arvore_estagio_5,
        R.drawable.arvore_estagio_6, R.drawable.arvore_estagio_7, R.drawable.arvore_estagio_8,
        R.drawable.arvore_estagio_9
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        desenhar(context, manager, ids, WidgetDados.calcular(context));
        WidgetAtualizador.agendar(context);
    }

    static void desenhar(Context c, AppWidgetManager m, int[] ids, WidgetCalculo.Resultado r) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_arvore);
        v.setOnClickPendingIntent(android.R.id.background, WidgetDados.abrirApp(c, "constancia", CODIGO_ABRIR));
        if (r.desatualizado) {
            v.setViewVisibility(R.id.arvore_imagem, View.GONE);
            v.setViewVisibility(R.id.arvore_pct, View.GONE);
            v.setViewVisibility(R.id.arvore_sequencia, View.GONE);
            v.setTextViewText(R.id.arvore_nome, c.getString(R.string.widget_desatualizado));
        } else {
            int e = Math.max(0, Math.min(ESTAGIOS.length - 1, r.estagio));
            v.setViewVisibility(R.id.arvore_imagem, View.VISIBLE);
            v.setViewVisibility(R.id.arvore_pct, View.VISIBLE);
            v.setViewVisibility(R.id.arvore_sequencia, View.VISIBLE);
            v.setImageViewResource(R.id.arvore_imagem, ESTAGIOS[e]);
            v.setContentDescription(R.id.arvore_imagem, c.getString(R.string.widget_arvore_imagem, r.nomeEstagio));
            v.setTextViewText(R.id.arvore_nome, r.nomeEstagio);
            v.setTextViewText(R.id.arvore_pct, c.getString(R.string.widget_pct_hoje, r.pctHoje));
            v.setTextViewText(R.id.arvore_sequencia, c.getString(r.sequencia == 1 ? R.string.widget_sequencia_um : R.string.widget_sequencia_varios, r.sequencia));
        }
        m.updateAppWidget(ids, v);
    }
}
