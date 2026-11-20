package com.minharotina.app;

import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import java.util.ArrayList;
import java.util.List;

public class HojeWidgetService extends RemoteViewsService {

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new Fabrica(getApplicationContext());
    }

    static class Fabrica implements RemoteViewsFactory {
        private final Context contexto;
        private List<WidgetCalculo.Item> itens = new ArrayList<>();
        private String hoje = "";

        Fabrica(Context contexto) {
            this.contexto = contexto;
        }

        @Override
        public void onCreate() {}

        @Override
        public void onDataSetChanged() {
            WidgetCalculo.Resultado r = WidgetDados.calcular(contexto);
            hoje = r.hoje;
            List<WidgetCalculo.Item> todos = r.desatualizado ? new ArrayList<WidgetCalculo.Item>() : r.itensHoje;
            itens = new ArrayList<>(todos.subList(0, Math.min(todos.size(), WidgetCalculo.MAX_ITENS)));
        }

        @Override
        public void onDestroy() {
            itens = new ArrayList<>();
        }

        @Override
        public int getCount() {
            return itens.size();
        }

        @Override
        public RemoteViews getViewAt(int posicao) {
            RemoteViews v = new RemoteViews(contexto.getPackageName(), R.layout.widget_hoje_item);
            if (posicao < 0 || posicao >= itens.size()) return v;
            WidgetCalculo.Item it = itens.get(posicao);
            String titulo = WidgetCalculo.encurtar(it.titulo, WidgetCalculo.MAX_TITULO);
            v.setTextViewText(R.id.item_titulo, titulo);
            v.setTextViewText(R.id.item_subtitulo, it.subtitulo == null ? "" : it.subtitulo);
            v.setImageViewResource(R.id.item_check, it.feito ? R.drawable.widget_check_on : R.drawable.widget_check_off);
            v.setContentDescription(R.id.item_raiz, contexto.getString(it.feito ? R.string.widget_item_feito : R.string.widget_item_pendente, titulo));
            Intent preencher = new Intent();
            preencher.putExtra("data", hoje);
            preencher.putExtra("id", it.id);
            preencher.putExtra("tipo", it.tipo);
            preencher.putExtra("feito", !it.feito);
            v.setOnClickFillInIntent(R.id.item_raiz, preencher);
            return v;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int posicao) {
            if (posicao < 0 || posicao >= itens.size()) return posicao;
            String id = itens.get(posicao).id;
            return id == null ? posicao : id.hashCode();
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }
    }
}
