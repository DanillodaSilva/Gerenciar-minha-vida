package com.minharotina.app;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class WidgetCalculo {

    public static final int AULA_OK = 0;
    public static final int AULA_SEM_SEMESTRE = 1;
    public static final int AULA_DESATIVADA = 2;
    public static final int AULA_NENHUMA = 3;
    public static final int MAX_ITENS = 30;
    public static final int MAX_TITULO = 60;
    public static final int DIAS_AULAS = 14;
    public static final int DIAS_RETRATO = 7;
    public static final int PERDA = 2;
    public static final int BONUS = 3;
    public static final int CICLO = 7;

    private WidgetCalculo() {}

    public static final class Item {
        public String id;
        public String tipo;
        public String titulo;
        public String subtitulo;
        public boolean feito;

        public Item(String id, String tipo, String titulo, String subtitulo, boolean feito) {
            this.id = id;
            this.tipo = tipo;
            this.titulo = titulo;
            this.subtitulo = subtitulo;
            this.feito = feito;
        }
    }

    public static final class Dia {
        public String data;
        public List<Item> itens = new ArrayList<>();

        public Dia(String data) {
            this.data = data;
        }
    }

    public static final class Aula {
        public String data;
        public String tempos;
        public String materia;
        public String sala;
        public String faltas;
        public String nivel;
    }

    public static final class Pendencia {
        public String data;
        public String id;
        public String tipo;
        public boolean feito;
        public String em;

        public Pendencia(String data, String id, String tipo, boolean feito, String em) {
            this.data = data;
            this.id = id;
            this.tipo = tipo;
            this.feito = feito;
            this.em = em;
        }
    }

    public static final class Retrato {
        public String hoje;
        public List<Dia> dias = new ArrayList<>();
        public int folhasAteOntem;
        public int tentativasAteOntem;
        public int[] estagios = new int[0];
        public String[] nomes = new String[0];
        public int sequenciaAteOntem;
        public boolean faculdadeVisivel;
        public boolean semestreConfigurado;
        public List<Aula> aulas = new ArrayList<>();
    }

    public static final class Resultado {
        public boolean desatualizado;
        public int folhas;
        public int folhasHoje;
        public int tentativas;
        public int sequencia;
        public int estagio;
        public String nomeEstagio = "";
        public String hoje;
        public List<Item> itensHoje = new ArrayList<>();
        public int totalHoje;
        public int feitosHoje;
        public int pctHoje;
        public int estadoAula = AULA_NENHUMA;
        public Aula proximaAula;
        public int diasAteAula;
    }

    public static final class Contagem {
        public final int feitos;
        public final int total;

        Contagem(int feitos, int total) {
            this.feitos = feitos;
            this.total = total;
        }

        public int pct() {
            return total == 0 ? 0 : (int) Math.round(feitos * 100.0 / total);
        }
    }

    public static Resultado calcular(Retrato r, List<Pendencia> pendencias, String hoje) {
        Resultado res = new Resultado();
        res.hoje = hoje;
        if (r == null || r.hoje == null) {
            res.desatualizado = true;
            return res;
        }
        List<Pendencia> pend = pendencias == null ? new ArrayList<Pendencia>() : pendencias;
        if (diasEntre(r.hoje, hoje) > DIAS_RETRATO) {
            res.desatualizado = true;
            return res;
        }
        int folhas = Math.max(0, r.folhasAteOntem);
        int tentativas = Math.max(0, r.tentativasAteOntem);
        int sequencia = Math.max(0, r.sequenciaAteOntem);
        for (String d = r.hoje; d.compareTo(hoje) < 0; d = somaDias(d, 1)) {
            Contagem c = contar(r, pend, d);
            if (c.total == 0) continue;
            int bonus = 0;
            if (c.feitos > 0) {
                tentativas++;
                if (tentativas % CICLO == 0) bonus = BONUS;
            } else {
                tentativas = 0;
            }
            folhas = Math.max(0, folhas + faixaDia(c.feitos, c.total, true) + bonus);
            sequencia = c.pct() >= 50 ? sequencia + 1 : 0;
        }
        Contagem agora = contar(r, pend, hoje);
        boolean tentouHoje = agora.total > 0 && agora.feitos > 0;
        int folhasHoje = tentouHoje ? folhasDaFaixa(agora.feitos, agora.total) + ((tentativas + 1) % CICLO == 0 ? BONUS : 0) : 0;
        folhas += folhasHoje;
        res.folhas = folhas;
        res.folhasHoje = folhasHoje;
        res.tentativas = tentativas + (tentouHoje ? 1 : 0);
        res.sequencia = sequencia;
        res.estagio = estagioDe(r.estagios, folhas);
        res.nomeEstagio = res.estagio < r.nomes.length && r.nomes[res.estagio] != null ? r.nomes[res.estagio] : "";
        res.itensHoje = itensDe(r, pend, hoje);
        res.totalHoje = agora.total;
        res.feitosHoje = agora.feitos;
        res.pctHoje = agora.pct();
        calcularAula(r, hoje, res);
        return res;
    }

    private static void calcularAula(Retrato r, String hoje, Resultado res) {
        if (!r.faculdadeVisivel) {
            res.estadoAula = AULA_DESATIVADA;
            return;
        }
        if (!r.semestreConfigurado) {
            res.estadoAula = AULA_SEM_SEMESTRE;
            return;
        }
        for (Aula a : r.aulas) {
            if (a.data == null) continue;
            int dif = diasEntre(hoje, a.data);
            if (dif >= 0 && dif < DIAS_AULAS) {
                res.estadoAula = AULA_OK;
                res.proximaAula = a;
                res.diasAteAula = dif;
                return;
            }
        }
        res.estadoAula = AULA_NENHUMA;
    }

    public static int folhasDaFaixa(int feitos, int total) {
        if (total <= 0 || feitos <= 0) return 0;
        if (feitos >= total) return 5;
        if ((long) feitos * 4 >= (long) total * 3) return 4;
        if ((long) feitos * 2 >= total) return 3;
        if ((long) feitos * 4 >= total) return 2;
        return 1;
    }

    public static int faixaDia(int feitos, int total, boolean encerrado) {
        if (total <= 0) return 0;
        if (feitos <= 0) return encerrado ? -PERDA : 0;
        return folhasDaFaixa(feitos, total);
    }

    public static int estagioDe(int[] estagios, int folhas) {
        int e = 0;
        for (int i = 0; i < estagios.length; i++) if (folhas >= estagios[i]) e = i;
        return e;
    }

    public static boolean feitoEm(List<Pendencia> pend, String data, String id, boolean padrao) {
        Pendencia melhor = null;
        for (Pendencia p : pend) {
            if (!data.equals(p.data) || id == null || !id.equals(p.id)) continue;
            if (melhor == null || comparar(p.em, melhor.em) >= 0) melhor = p;
        }
        return melhor == null ? padrao : melhor.feito;
    }

    private static int comparar(String a, String b) {
        return (a == null ? "" : a).compareTo(b == null ? "" : b);
    }

    public static Contagem contar(Retrato r, List<Pendencia> pend, String data) {
        int feitos = 0, total = 0;
        for (Item i : itensDe(r, pend, data)) {
            total++;
            if (i.feito) feitos++;
        }
        return new Contagem(feitos, total);
    }

    public static List<Item> itensDe(Retrato r, List<Pendencia> pend, String data) {
        List<Item> lista = new ArrayList<>();
        for (Dia d : r.dias) {
            if (!data.equals(d.data)) continue;
            for (Item i : d.itens) {
                lista.add(new Item(i.id, i.tipo, i.titulo, i.subtitulo, feitoEm(pend, data, i.id, i.feito)));
            }
        }
        return lista;
    }

    public static String encurtar(String texto, int max) {
        if (texto == null) return "";
        if (texto.codePointCount(0, texto.length()) <= max) return texto;
        int fim = texto.offsetByCodePoints(0, max - 1);
        return texto.substring(0, fim).trim() + "…";
    }

    public static long diaDaEpoca(String data) {
        int y = Integer.parseInt(data.substring(0, 4));
        int m = Integer.parseInt(data.substring(5, 7));
        int d = Integer.parseInt(data.substring(8, 10));
        y -= m <= 2 ? 1 : 0;
        long era = (y >= 0 ? y : y - 399) / 400;
        long yoe = y - era * 400;
        long doy = (153L * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1;
        long doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
        return era * 146097 + doe - 719468;
    }

    public static String dataDe(long dias) {
        long z = dias + 719468;
        long era = (z >= 0 ? z : z - 146096) / 146097;
        long doe = z - era * 146097;
        long yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        long y = yoe + era * 400;
        long doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        long mp = (5 * doy + 2) / 153;
        long d = doy - (153 * mp + 2) / 5 + 1;
        long m = mp + (mp < 10 ? 3 : -9);
        if (m <= 2) y++;
        return String.format(Locale.ROOT, "%04d-%02d-%02d", y, m, d);
    }

    public static String somaDias(String data, int n) {
        return dataDe(diaDaEpoca(data) + n);
    }

    public static int diasEntre(String de, String ate) {
        return (int) (diaDaEpoca(ate) - diaDaEpoca(de));
    }

    public static int diaDaSemana(String data) {
        return (int) (((diaDaEpoca(data) + 4) % 7 + 7) % 7);
    }

    public static Retrato retratoDe(String json) {
        return retratoDe(Json.ler(json));
    }

    public static Retrato retratoDe(Object raiz) {
        if (!(raiz instanceof Map)) throw new IllegalArgumentException("retrato inválido");
        Map<String, Object> o = mapa(raiz);
        Retrato r = new Retrato();
        r.hoje = texto(o.get("hoje"));
        for (Object od : lista(o.get("dias"))) {
            Map<String, Object> md = mapa(od);
            Dia d = new Dia(texto(md.get("data")));
            for (Object oi : lista(md.get("itens"))) {
                Map<String, Object> mi = mapa(oi);
                d.itens.add(new Item(texto(mi.get("id")), texto(mi.get("tipo")), texto(mi.get("titulo")), texto(mi.get("subtitulo")), Boolean.TRUE.equals(mi.get("feito"))));
            }
            r.dias.add(d);
        }
        Map<String, Object> arv = mapa(o.get("arvore"));
        r.folhasAteOntem = inteiro(arv.get("folhasAteOntem"));
        r.tentativasAteOntem = inteiro(arv.get("tentativasAteOntem"));
        List<Object> est = lista(arv.get("estagios"));
        r.estagios = new int[est.size()];
        for (int i = 0; i < est.size(); i++) r.estagios[i] = inteiro(est.get(i));
        List<Object> nom = lista(arv.get("nomes"));
        r.nomes = new String[nom.size()];
        for (int i = 0; i < nom.size(); i++) r.nomes[i] = texto(nom.get(i));
        r.sequenciaAteOntem = inteiro(mapa(o.get("sequencia")).get("ateOntem"));
        r.faculdadeVisivel = Boolean.TRUE.equals(o.get("faculdadeVisivel"));
        r.semestreConfigurado = Boolean.TRUE.equals(o.get("semestreConfigurado"));
        for (Object oa : lista(o.get("aulas"))) {
            Map<String, Object> ma = mapa(oa);
            Aula a = new Aula();
            a.data = texto(ma.get("data"));
            a.tempos = texto(ma.get("tempos"));
            a.materia = texto(ma.get("materia"));
            a.sala = texto(ma.get("sala"));
            a.faltas = texto(ma.get("faltas"));
            a.nivel = texto(ma.get("nivel"));
            r.aulas.add(a);
        }
        return r;
    }

    public static List<Pendencia> pendenciasDe(String json) {
        List<Pendencia> lista = new ArrayList<>();
        if (json == null || json.trim().isEmpty()) return lista;
        return pendenciasDe(Json.ler(json));
    }

    public static List<Pendencia> pendenciasDe(Object raiz) {
        List<Pendencia> lista = new ArrayList<>();
        for (Object op : lista(raiz)) {
            Map<String, Object> m = mapa(op);
            lista.add(new Pendencia(texto(m.get("data")), texto(m.get("id")), texto(m.get("tipo")), Boolean.TRUE.equals(m.get("feito")), texto(m.get("em"))));
        }
        return lista;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapa(Object o) {
        return o instanceof Map ? (Map<String, Object>) o : new LinkedHashMap<String, Object>();
    }

    @SuppressWarnings("unchecked")
    private static List<Object> lista(Object o) {
        return o instanceof List ? (List<Object>) o : new ArrayList<Object>();
    }

    private static String texto(Object o) {
        return o instanceof String ? (String) o : (o == null ? null : String.valueOf(o));
    }

    private static int inteiro(Object o) {
        return o instanceof Number ? ((Number) o).intValue() : 0;
    }

    public static final class Json {
        private final String s;
        private int i;

        private Json(String s) {
            this.s = s;
        }

        public static Object ler(String texto) {
            Json j = new Json(texto);
            j.espacos();
            Object v = j.valor();
            j.espacos();
            if (j.i != j.s.length()) throw j.erro();
            return v;
        }

        private IllegalArgumentException erro() {
            return new IllegalArgumentException("JSON inválido na posição " + i);
        }

        private void espacos() {
            while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++;
        }

        private char atual() {
            if (i >= s.length()) throw erro();
            return s.charAt(i);
        }

        private Object valor() {
            char c = atual();
            if (c == '{') return objeto();
            if (c == '[') return vetor();
            if (c == '"') return cadeia();
            if (s.startsWith("true", i)) { i += 4; return Boolean.TRUE; }
            if (s.startsWith("false", i)) { i += 5; return Boolean.FALSE; }
            if (s.startsWith("null", i)) { i += 4; return null; }
            return numero();
        }

        private Map<String, Object> objeto() {
            Map<String, Object> m = new LinkedHashMap<>();
            i++;
            espacos();
            if (atual() == '}') { i++; return m; }
            while (true) {
                espacos();
                if (atual() != '"') throw erro();
                String k = cadeia();
                espacos();
                if (atual() != ':') throw erro();
                i++;
                espacos();
                m.put(k, valor());
                espacos();
                char c = atual();
                i++;
                if (c == '}') return m;
                if (c != ',') throw erro();
            }
        }

        private List<Object> vetor() {
            List<Object> l = new ArrayList<>();
            i++;
            espacos();
            if (atual() == ']') { i++; return l; }
            while (true) {
                espacos();
                l.add(valor());
                espacos();
                char c = atual();
                i++;
                if (c == ']') return l;
                if (c != ',') throw erro();
            }
        }

        private String cadeia() {
            StringBuilder b = new StringBuilder();
            i++;
            while (true) {
                char c = atual();
                i++;
                if (c == '"') return b.toString();
                if (c != '\\') { b.append(c); continue; }
                char e = atual();
                i++;
                switch (e) {
                    case 'n': b.append('\n'); break;
                    case 't': b.append('\t'); break;
                    case 'r': b.append('\r'); break;
                    case 'b': b.append('\b'); break;
                    case 'f': b.append('\f'); break;
                    case 'u':
                        if (i + 4 > s.length()) throw erro();
                        b.append((char) Integer.parseInt(s.substring(i, i + 4), 16));
                        i += 4;
                        break;
                    default: b.append(e);
                }
            }
        }

        private Number numero() {
            int ini = i;
            while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) i++;
            if (ini == i) throw erro();
            String n = s.substring(ini, i);
            if (n.indexOf('.') < 0 && n.indexOf('e') < 0 && n.indexOf('E') < 0) return Long.parseLong(n);
            return Double.parseDouble(n);
        }
    }
}
