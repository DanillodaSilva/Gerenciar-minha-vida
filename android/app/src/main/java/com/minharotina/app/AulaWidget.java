package com.minharotina.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;
import java.util.ArrayList;
import java.util.List;

public class AulaWidget extends AppWidgetProvider {

    static final int CODIGO_ABRIR = 4301;
    private static final int[] FALTAS = {
        R.id.aula_faltas_ok, R.id.aula_faltas_atencao, R.id.aula_faltas_perigo, R.id.aula_faltas_critico
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        desenhar(context, manager, ids, WidgetDados.calcular(context));
        WidgetAtualizador.agendar(context);
    }

    static void desenhar(Context c, AppWidgetManager m, int[] ids, WidgetCalculo.Resultado r) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_aula);
        v.setOnClickPendingIntent(android.R.id.background, WidgetDados.abrirApp(c, "faculdade", CODIGO_ABRIR));
        for (int id : FALTAS) v.setViewVisibility(id, View.GONE);
        WidgetCalculo.Aula a = r.proximaAula;
        if (r.desatualizado) {
            v.setTextViewText(R.id.aula_linha, c.getString(R.string.widget_desatualizado));
        } else if (r.estadoAula == WidgetCalculo.AULA_DESATIVADA) {
            v.setTextViewText(R.id.aula_linha, c.getString(R.string.widget_aula_desativada));
        } else if (r.estadoAula == WidgetCalculo.AULA_SEM_SEMESTRE) {
            v.setTextViewText(R.id.aula_linha, c.getString(R.string.widget_aula_configure));
        } else if (r.estadoAula != WidgetCalculo.AULA_OK || a == null) {
            v.setTextViewText(R.id.aula_linha, c.getString(R.string.widget_aula_sem));
        } else {
            List<String> partes = new ArrayList<>();
            for (String s : new String[] { a.tempos, a.materia, a.sala }) if (s != null && !s.trim().isEmpty()) partes.add(s.trim());
            v.setTextViewText(R.id.aula_linha, c.getString(R.string.widget_aula_linha, rotuloDia(c, r), juntar(partes)));
            if (a.faltas != null && !a.faltas.isEmpty()) {
                int alvo = FALTAS[indiceNivel(a.nivel)];
                v.setViewVisibility(alvo, View.VISIBLE);
                v.setTextViewText(alvo, c.getString(R.string.widget_aula_faltas, a.faltas));
            }
        }
        m.updateAppWidget(ids, v);
    }

    private static String rotuloDia(Context c, WidgetCalculo.Resultado r) {
        if (r.diasAteAula == 0) return c.getString(R.string.widget_dia_hoje);
        if (r.diasAteAula == 1) return c.getString(R.string.widget_dia_amanha);
        String[] dias = c.getResources().getStringArray(R.array.widget_dias_semana);
        return dias[WidgetCalculo.diaDaSemana(r.proximaAula.data)];
    }

    private static int indiceNivel(String nivel) {
        if ("atencao".equals(nivel)) return 1;
        if ("perigo".equals(nivel)) return 2;
        if ("ultima_chance".equals(nivel) || "ultrapassado".equals(nivel)) return 3;
        return 0;
    }

    private static String juntar(List<String> partes) {
        StringBuilder b = new StringBuilder();
        for (String p : partes) {
            if (b.length() > 0) b.append(" · ");
            b.append(p);
        }
        return b.toString();
    }
}
