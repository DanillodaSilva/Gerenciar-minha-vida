package com.minharotina.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public final class WidgetDados {

    public static final String PREFS = "rotina_widget";
    public static final String CHAVE_RETRATO = "retrato";
    public static final String CHAVE_PENDENCIAS = "pendencias";
    public static final String EXTRA_ABA = "aba";

    private WidgetDados() {}

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void gravarRetrato(Context c, String json) {
        prefs(c).edit().putString(CHAVE_RETRATO, json).commit();
    }

    public static String lerRetrato(Context c) {
        return prefs(c).getString(CHAVE_RETRATO, null);
    }

    public static String lerPendencias(Context c) {
        String s = prefs(c).getString(CHAVE_PENDENCIAS, null);
        return s == null || s.trim().isEmpty() ? "[]" : s;
    }

    private static JSONArray pendenciasArray(Context c) {
        try {
            return new JSONArray(lerPendencias(c));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    public static synchronized void gravarPendencia(Context c, String data, String id, String tipo, boolean feito) throws JSONException {
        JSONArray atual = pendenciasArray(c);
        JSONArray nova = new JSONArray();
        for (int i = 0; i < atual.length(); i++) {
            JSONObject p = atual.optJSONObject(i);
            if (p == null) continue;
            if (data.equals(p.optString("data")) && id.equals(p.optString("id"))) continue;
            nova.put(p);
        }
        JSONObject p = new JSONObject();
        p.put("data", data);
        p.put("id", id);
        p.put("tipo", tipo == null ? "rotina" : tipo);
        p.put("feito", feito);
        p.put("em", agoraIso());
        nova.put(p);
        prefs(c).edit().putString(CHAVE_PENDENCIAS, nova.toString()).commit();
    }

    public static synchronized void limparAte(Context c, String ate) {
        JSONArray atual = pendenciasArray(c);
        JSONArray nova = new JSONArray();
        for (int i = 0; i < atual.length(); i++) {
            JSONObject p = atual.optJSONObject(i);
            if (p == null) continue;
            if (p.optString("em", "").compareTo(ate) <= 0) continue;
            nova.put(p);
        }
        prefs(c).edit().putString(CHAVE_PENDENCIAS, nova.toString()).commit();
    }

    public static String agoraIso() {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.ROOT);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f.format(new Date());
    }

    public static String hojeAparelho() {
        Calendar c = Calendar.getInstance();
        return String.format(Locale.ROOT, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    public static WidgetCalculo.Resultado calcular(Context c) {
        String retrato = lerRetrato(c);
        String hoje = hojeAparelho();
        try {
            WidgetCalculo.Retrato r = retrato == null ? null : WidgetCalculo.retratoDe(retrato);
            return WidgetCalculo.calcular(r, WidgetCalculo.pendenciasDe(lerPendencias(c)), hoje);
        } catch (RuntimeException e) {
            return WidgetCalculo.calcular(null, null, hoje);
        }
    }

    public static PendingIntent abrirApp(Context c, String aba, int codigo) {
        Intent i = new Intent(c, MainActivity.class);
        i.putExtra(EXTRA_ABA, aba);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(c, codigo, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    public static int[] ids(Context c, Class<?> provider) {
        return AppWidgetManager.getInstance(c).getAppWidgetIds(new ComponentName(c, provider));
    }

    public static boolean existeAlgum(Context c) {
        return ids(c, ArvoreWidget.class).length + ids(c, HojeWidget.class).length + ids(c, AulaWidget.class).length > 0;
    }

    public static void atualizarTodos(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        WidgetCalculo.Resultado r = calcular(c);
        int[] arvore = ids(c, ArvoreWidget.class);
        int[] hoje = ids(c, HojeWidget.class);
        int[] aula = ids(c, AulaWidget.class);
        if (arvore.length > 0) ArvoreWidget.desenhar(c, m, arvore, r);
        if (hoje.length > 0) {
            HojeWidget.desenhar(c, m, hoje, r);
            m.notifyAppWidgetViewDataChanged(hoje, R.id.hoje_lista);
        }
        if (aula.length > 0) AulaWidget.desenhar(c, m, aula, r);
    }
}
