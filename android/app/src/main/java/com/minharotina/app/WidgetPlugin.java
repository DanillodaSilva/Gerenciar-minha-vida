package com.minharotina.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.lang.ref.WeakReference;
import org.json.JSONException;

@CapacitorPlugin(name = "Widget")
public class WidgetPlugin extends Plugin {

    private static WeakReference<WidgetPlugin> ativo = new WeakReference<>(null);

    @Override
    public void load() {
        ativo = new WeakReference<>(this);
    }

    @Override
    protected void handleOnDestroy() {
        if (ativo.get() == this) ativo = new WeakReference<>(null);
    }

    @PluginMethod
    public void publicar(PluginCall call) {
        String json = call.getString("json");
        if (json == null) {
            call.reject("json ausente");
            return;
        }
        try {
            WidgetCalculo.retratoDe(json);
        } catch (RuntimeException e) {
            call.reject("retrato inválido", e);
            return;
        }
        Context c = getContext();
        WidgetDados.gravarRetrato(c, json);
        WidgetDados.atualizarTodos(c);
        WidgetAtualizador.agendar(c);
        call.resolve();
    }

    @PluginMethod
    public void lerPendentes(PluginCall call) {
        try {
            JSObject ret = new JSObject();
            ret.put("pendencias", new JSArray(WidgetDados.lerPendencias(getContext())));
            call.resolve(ret);
        } catch (JSONException e) {
            call.reject("pendências ilegíveis", e);
        }
    }

    @PluginMethod
    public void limparPendentes(PluginCall call) {
        String ate = call.getString("ate");
        if (ate == null) {
            call.reject("ate ausente");
            return;
        }
        WidgetDados.limparAte(getContext(), ate);
        WidgetDados.atualizarTodos(getContext());
        call.resolve();
    }

    @PluginMethod
    public void pedirFixar(PluginCall call) {
        String tipo = call.getString("tipo", "");
        Class<?> provider;
        if ("arvore".equals(tipo)) provider = ArvoreWidget.class;
        else if ("hoje".equals(tipo)) provider = HojeWidget.class;
        else if ("aula".equals(tipo)) provider = AulaWidget.class;
        else {
            call.reject("tipo inválido");
            return;
        }
        JSObject ret = new JSObject();
        boolean suportado = podeFixar(getContext());
        boolean ok = false;
        if (suportado && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AppWidgetManager m = AppWidgetManager.getInstance(getContext());
            try {
                ok = m.requestPinAppWidget(new ComponentName(getContext(), provider), null, null);
            } catch (RuntimeException e) {
                ok = false;
            }
        }
        ret.put("ok", ok);
        ret.put("suportado", suportado);
        call.resolve(ret);
    }

    @PluginMethod
    public void suportado(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("suportado", true);
        ret.put("fixar", podeFixar(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void abaInicial(PluginCall call) {
        JSObject ret = new JSObject();
        Intent intent = getActivity() == null ? null : getActivity().getIntent();
        String aba = intent == null ? null : intent.getStringExtra(WidgetDados.EXTRA_ABA);
        if (intent != null) intent.removeExtra(WidgetDados.EXTRA_ABA);
        ret.put("aba", aba == null ? JSObject.NULL : aba);
        call.resolve(ret);
    }

    private static boolean podeFixar(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return false;
        return AppWidgetManager.getInstance(c).isRequestPinAppWidgetSupported();
    }

    public static void receberIntent(Intent intent) {
        WidgetPlugin p = ativo.get();
        if (p == null || intent == null) return;
        String aba = intent.getStringExtra(WidgetDados.EXTRA_ABA);
        if (aba == null || !p.hasListeners("aba")) return;
        intent.removeExtra(WidgetDados.EXTRA_ABA);
        JSObject dados = new JSObject();
        dados.put("aba", aba);
        p.notifyListeners("aba", dados);
    }

    public static void avisarPendencias(Context c) {
        WidgetPlugin p = ativo.get();
        if (p == null) return;
        try {
            JSObject dados = new JSObject();
            dados.put("pendencias", new JSArray(WidgetDados.lerPendencias(c)));
            p.notifyListeners("pendencias", dados);
        } catch (JSONException ignorada) {
        }
    }
}
