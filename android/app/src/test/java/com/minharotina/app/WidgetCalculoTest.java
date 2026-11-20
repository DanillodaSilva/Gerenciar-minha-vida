package com.minharotina.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.BeforeClass;
import org.junit.Test;

public class WidgetCalculoTest {

    private static Map<String, Object> fixture;
    static File arquivoFixture;

    @BeforeClass
    @SuppressWarnings("unchecked")
    public static void carregar() throws Exception {
        arquivoFixture = acharFixture();
        String texto = new String(Files.readAllBytes(arquivoFixture.toPath()), StandardCharsets.UTF_8);
        fixture = (Map<String, Object>) WidgetCalculo.Json.ler(texto);
    }

    private static File acharFixture() {
        File direto = new File("../../testes/fixtures/widget-retrato.json");
        if (direto.isFile()) return direto;
        File dir = new File(System.getProperty("user.dir")).getAbsoluteFile();
        while (dir != null) {
            File f = new File(dir, "testes/fixtures/widget-retrato.json");
            if (f.isFile()) return f;
            dir = dir.getParentFile();
        }
        throw new IllegalStateException("fixture widget-retrato.json não encontrado a partir de " + System.getProperty("user.dir"));
    }

    private static WidgetCalculo.Retrato retrato() {
        return WidgetCalculo.retratoDe(fixture.get("retrato"));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> retratoMapa() throws Exception {
        String texto = new String(Files.readAllBytes(arquivoFixture.toPath()), StandardCharsets.UTF_8);
        return (Map<String, Object>) ((Map<String, Object>) WidgetCalculo.Json.ler(texto)).get("retrato");
    }

    private static WidgetCalculo.Retrato retratoDeUmDia(int feitos, int total, int folhasAteOntem) {
        WidgetCalculo.Retrato r = new WidgetCalculo.Retrato();
        r.hoje = "2026-11-18";
        WidgetCalculo.Dia d = new WidgetCalculo.Dia("2026-11-18");
        for (int i = 0; i < total; i++) d.itens.add(new WidgetCalculo.Item("i" + i, "rotina", "Item " + i, "", i < feitos));
        r.dias.add(d);
        r.folhasAteOntem = folhasAteOntem;
        r.estagios = new int[] {0, 5, 15, 35, 70, 140, 250, 400, 600, 1000};
        r.nomes = new String[] {"Semente", "Broto", "Muda", "Arvoreta", "Árvore jovem", "Árvore", "Árvore frondosa", "Árvore florida", "Árvore com frutos", "Árvore anciã"};
        return r;
    }

    private static int variacaoDia(int feitos, int total) {
        return WidgetCalculo.calcular(retratoDeUmDia(feitos, total, 100), null, "2026-11-19").folhas - 100;
    }

    private static WidgetCalculo.Retrato retratoDeDias(String inicio, int dias, int feitos, int total, int folhasAteOntem, int tentativasAteOntem) {
        WidgetCalculo.Retrato r = new WidgetCalculo.Retrato();
        r.hoje = inicio;
        for (int k = 0; k < dias; k++) {
            WidgetCalculo.Dia d = new WidgetCalculo.Dia(WidgetCalculo.somaDias(inicio, k));
            for (int i = 0; i < total; i++) d.itens.add(new WidgetCalculo.Item("i" + i, "rotina", "Item " + i, "", i < feitos));
            r.dias.add(d);
        }
        r.folhasAteOntem = folhasAteOntem;
        r.tentativasAteOntem = tentativasAteOntem;
        r.estagios = new int[] {0, 5, 15, 35};
        r.nomes = new String[] {"Semente", "Broto", "Muda", "Arvoreta"};
        return r;
    }

    private static List<WidgetCalculo.Pendencia> pendencias() {
        return WidgetCalculo.pendenciasDe(fixture.get("pendencias"));
    }

    @Test
    public void localizaFixture() {
        assertTrue(arquivoFixture.isFile());
    }

    @Test
    @SuppressWarnings("unchecked")
    public void fixtureEmVinteDeNovembro() {
        String em = (String) fixture.get("calcularEm");
        Map<String, Object> esp = (Map<String, Object>) fixture.get("esperado");
        WidgetCalculo.Resultado r = WidgetCalculo.calcular(retrato(), pendencias(), em);
        assertFalse(r.desatualizado);
        assertEquals(((Number) esp.get("folhas")).intValue(), r.folhas);
        assertEquals(((Number) esp.get("sequencia")).intValue(), r.sequencia);
        assertEquals(((Number) esp.get("estagio")).intValue(), r.estagio);
        assertEquals(esp.get("nomeEstagio"), r.nomeEstagio);
        assertEquals(((Number) esp.get("itensHoje")).intValue(), r.itensHoje.size());
        assertEquals(((Number) esp.get("feitosHoje")).intValue(), r.feitosHoje);
        assertEquals(((Number) esp.get("pctHoje")).intValue(), r.pctHoje);
        assertEquals(((Number) esp.get("folhasHoje")).intValue(), r.folhasHoje);
        assertEquals(((Number) esp.get("tentativas")).intValue(), r.tentativas);
        assertEquals(22, r.folhas);
        assertEquals(0, r.sequencia);
        assertEquals(7, r.tentativas);
        assertEquals(0, r.folhasHoje);
        assertEquals(2, r.estagio);
        assertEquals("Muda", r.nomeEstagio);
        assertEquals(4, r.totalHoje);
        assertEquals(0, r.feitosHoje);
    }

    @Test
    public void contagensDosDias() {
        WidgetCalculo.Contagem d18 = WidgetCalculo.contar(retrato(), pendencias(), "2026-11-18");
        WidgetCalculo.Contagem d19 = WidgetCalculo.contar(retrato(), pendencias(), "2026-11-19");
        assertEquals(4, d18.feitos);
        assertEquals(4, d18.total);
        assertEquals(1, d19.feitos);
        assertEquals(4, d19.total);
        assertEquals(25, d19.pct());
    }

    @Test
    public void viradaDeUmDia() {
        WidgetCalculo.Resultado r = WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-19");
        assertFalse(r.desatualizado);
        assertEquals(22, r.folhas);
        assertEquals(5, r.folhasHoje);
        assertEquals(7, r.tentativas);
        assertEquals(6, r.sequencia);
        assertEquals(4, r.totalHoje);
        assertEquals(1, r.feitosHoje);
        assertEquals(25, r.pctHoje);
    }

    @Test
    public void mesmoDiaDoRetrato() {
        WidgetCalculo.Resultado r = WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-18");
        assertEquals(17, r.folhas);
        assertEquals(5, r.folhasHoje);
        assertEquals(6, r.tentativas);
        assertEquals(5, r.sequencia);
        assertEquals(4, r.feitosHoje);
        assertEquals(100, r.pctHoje);
    }

    @Test
    public void viradaDeDoisDias() {
        WidgetCalculo.Resultado r = WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-20");
        assertEquals(22, r.folhas);
        assertEquals(0, r.sequencia);
        assertEquals(7, r.tentativas);
        assertEquals(2, r.estagio);
    }

    @Test
    public void retratoVersaoUmSemTentativas() throws Exception {
        Map<String, Object> m = retratoMapa();
        m.put("versao", 1L);
        ((Map<?, ?>) m.get("arvore")).remove("tentativasAteOntem");
        WidgetCalculo.Retrato r = WidgetCalculo.retratoDe(m);
        assertEquals(0, r.tentativasAteOntem);
        WidgetCalculo.Resultado x = WidgetCalculo.calcular(r, pendencias(), "2026-11-20");
        assertEquals(19, x.folhas);
        assertEquals(2, x.tentativas);
        assertEquals(0, x.folhasHoje);
    }

    @Test
    public void lerTentativasDoRetrato() {
        assertEquals(5, retrato().tentativasAteOntem);
    }

    @Test
    @SuppressWarnings("unchecked")
    public void tudoEmBrancoNaoFicaNegativo() throws Exception {
        Map<String, Object> m = retratoMapa();
        ((Map<String, Object>) m.get("arvore")).put("folhasAteOntem", 0L);
        for (Object od : (List<Object>) m.get("dias")) {
            for (Object oi : (List<Object>) ((Map<String, Object>) od).get("itens")) ((Map<String, Object>) oi).put("feito", Boolean.FALSE);
        }
        WidgetCalculo.Resultado x = WidgetCalculo.calcular(WidgetCalculo.retratoDe(m), null, "2026-11-20");
        assertEquals(0, x.folhas);
        assertEquals(0, x.tentativas);
        assertEquals(0, x.estagio);
    }

    @Test
    public void faixasDeDezItens() {
        int[] feitos = {0, 1, 2, 3, 4, 5, 7, 8, 9, 10};
        int[] esperado = {-2, 1, 1, 2, 2, 3, 3, 4, 4, 5};
        for (int i = 0; i < feitos.length; i++) assertEquals("feitos " + feitos[i], esperado[i], variacaoDia(feitos[i], 10));
    }

    @Test
    public void faixasSemArredondar() {
        assertEquals(2, variacaoDia(3, 12));
        assertEquals(2, variacaoDia(1, 3));
        assertEquals(3, variacaoDia(2, 3));
        assertEquals(5, variacaoDia(3, 3));
        assertEquals(0, WidgetCalculo.faixaDia(0, 0, true));
        assertEquals(0, WidgetCalculo.faixaDia(0, 4, false));
        assertEquals(-2, WidgetCalculo.faixaDia(0, 4, true));
    }

    @Test
    public void emBrancoRespeitaPiso() {
        assertEquals(0, WidgetCalculo.calcular(retratoDeUmDia(0, 3, 1), null, "2026-11-19").folhas);
        assertEquals(0, WidgetCalculo.calcular(retratoDeUmDia(0, 3, 2), null, "2026-11-19").folhas);
        assertEquals(1, WidgetCalculo.calcular(retratoDeUmDia(0, 3, 3), null, "2026-11-19").folhas);
    }

    @Test
    public void emBrancoZeraTentativas() {
        WidgetCalculo.Retrato r = retratoDeUmDia(0, 3, 10);
        r.tentativasAteOntem = 6;
        WidgetCalculo.Resultado x = WidgetCalculo.calcular(r, null, "2026-11-19");
        assertEquals(0, x.tentativas);
        assertEquals(8, x.folhas);
    }

    @Test
    public void bonusDeSeteDias() {
        WidgetCalculo.Resultado sete = WidgetCalculo.calcular(retratoDeDias("2026-11-01", 7, 1, 10, 0, 0), null, "2026-11-08");
        assertFalse(sete.desatualizado);
        assertEquals(10, sete.folhas);
        assertEquals(7, sete.tentativas);
        WidgetCalculo.Retrato seguinte = retratoDeDias("2026-11-08", 7, 1, 10, sete.folhas, sete.tentativas);
        WidgetCalculo.Resultado quatorze = WidgetCalculo.calcular(seguinte, null, "2026-11-15");
        assertEquals(20, quatorze.folhas);
        assertEquals(14, quatorze.tentativas);
    }

    @Test
    public void bonusCaiNoDiaDeHoje() {
        WidgetCalculo.Resultado x = WidgetCalculo.calcular(retratoDeDias("2026-11-01", 8, 1, 10, 0, 0), null, "2026-11-07");
        assertEquals(4, x.folhasHoje);
        assertEquals(10, x.folhas);
        assertEquals(7, x.tentativas);
        WidgetCalculo.Resultado antes = WidgetCalculo.calcular(retratoDeDias("2026-11-01", 8, 1, 10, 0, 0), null, "2026-11-06");
        assertEquals(1, antes.folhasHoje);
        assertEquals(6, antes.folhas);
    }

    @Test
    public void hojeNuncaPerde() {
        WidgetCalculo.Resultado x = WidgetCalculo.calcular(retratoDeUmDia(0, 4, 9), null, "2026-11-18");
        assertEquals(9, x.folhas);
        assertEquals(0, x.folhasHoje);
        assertEquals(0, x.tentativas);
    }

    @Test
    public void seteDiasAindaValeOitoDesatualiza() {
        assertFalse(WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-25").desatualizado);
        WidgetCalculo.Resultado r = WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-26");
        assertTrue(r.desatualizado);
        assertTrue(r.itensHoje.isEmpty());
    }

    @Test
    public void pendenciaMaisRecenteVale() {
        List<WidgetCalculo.Pendencia> p = pendencias();
        assertTrue(WidgetCalculo.feitoEm(p, "2026-11-18", "i3", false));
        List<WidgetCalculo.Pendencia> invertida = new ArrayList<>();
        for (int i = p.size() - 1; i >= 0; i--) invertida.add(p.get(i));
        assertTrue(WidgetCalculo.feitoEm(invertida, "2026-11-18", "i3", false));
        boolean i3 = false;
        for (WidgetCalculo.Item it : WidgetCalculo.itensDe(retrato(), p, "2026-11-18")) if ("i3".equals(it.id)) i3 = it.feito;
        assertTrue(i3);
        assertFalse(WidgetCalculo.feitoEm(p, "2026-11-20", "i3", false));
    }

    @Test
    public void diaSemItensNaoMudaNada() {
        WidgetCalculo.Resultado antes = WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-22");
        WidgetCalculo.Resultado depois = WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-23");
        assertEquals(18, antes.folhas);
        assertEquals(antes.folhas, depois.folhas);
        assertEquals(antes.tentativas, depois.tentativas);
        assertEquals(antes.sequencia, depois.sequencia);
        assertEquals(0, antes.totalHoje);

        WidgetCalculo.Retrato r = new WidgetCalculo.Retrato();
        r.hoje = "2026-11-22";
        r.dias.add(new WidgetCalculo.Dia("2026-11-22"));
        WidgetCalculo.Dia d23 = new WidgetCalculo.Dia("2026-11-23");
        d23.itens.add(new WidgetCalculo.Item("a", "rotina", "A", "", false));
        r.dias.add(d23);
        r.folhasAteOntem = 5;
        r.tentativasAteOntem = 4;
        r.sequenciaAteOntem = 3;
        r.estagios = new int[] {0, 1, 3, 7};
        r.nomes = new String[] {"Semente", "Broto", "Muda", "Arvoreta"};
        WidgetCalculo.Resultado x = WidgetCalculo.calcular(r, null, "2026-11-23");
        assertEquals(5, x.folhas);
        assertEquals(4, x.tentativas);
        assertEquals(3, x.sequencia);
        assertEquals(2, x.estagio);
    }

    @Test
    public void pisoZero() {
        WidgetCalculo.Retrato r = new WidgetCalculo.Retrato();
        r.hoje = "2026-11-18";
        WidgetCalculo.Dia d = new WidgetCalculo.Dia("2026-11-18");
        d.itens.add(new WidgetCalculo.Item("a", "rotina", "A", "", false));
        d.itens.add(new WidgetCalculo.Item("b", "rotina", "B", "", false));
        r.dias.add(d);
        r.folhasAteOntem = 0;
        r.sequenciaAteOntem = 2;
        r.estagios = new int[] {0, 1};
        r.nomes = new String[] {"Semente", "Broto"};
        WidgetCalculo.Resultado x = WidgetCalculo.calcular(r, null, "2026-11-19");
        assertEquals(0, x.folhas);
        assertEquals(0, x.sequencia);
        assertEquals(0, x.estagio);
        assertEquals("Semente", x.nomeEstagio);
    }

    @Test
    public void meioFeitoGanhaTres() {
        WidgetCalculo.Retrato r = new WidgetCalculo.Retrato();
        r.hoje = "2026-11-18";
        WidgetCalculo.Dia d = new WidgetCalculo.Dia("2026-11-18");
        d.itens.add(new WidgetCalculo.Item("a", "rotina", "A", "", true));
        d.itens.add(new WidgetCalculo.Item("b", "rotina", "B", "", false));
        r.dias.add(d);
        r.folhasAteOntem = 4;
        r.sequenciaAteOntem = 2;
        WidgetCalculo.Resultado x = WidgetCalculo.calcular(r, null, "2026-11-19");
        assertEquals(7, x.folhas);
        assertEquals(1, x.tentativas);
        assertEquals(3, x.sequencia);
    }

    @Test
    public void proximaAula() {
        WidgetCalculo.Resultado r = WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-20");
        assertEquals(WidgetCalculo.AULA_OK, r.estadoAula);
        assertNotNull(r.proximaAula);
        assertEquals("Física Geral", r.proximaAula.materia);
        assertEquals("perigo", r.proximaAula.nivel);
        assertEquals(0, r.diasAteAula);

        WidgetCalculo.Resultado r18 = WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-18");
        assertEquals("Cálculo I", r18.proximaAula.materia);
        assertEquals(1, r18.diasAteAula);

        WidgetCalculo.Resultado r21 = WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-21");
        assertEquals(WidgetCalculo.AULA_NENHUMA, r21.estadoAula);
        assertNull(r21.proximaAula);

        WidgetCalculo.Retrato semSem = retrato();
        semSem.semestreConfigurado = false;
        assertEquals(WidgetCalculo.AULA_SEM_SEMESTRE, WidgetCalculo.calcular(semSem, null, "2026-11-18").estadoAula);
        WidgetCalculo.Retrato oculta = retrato();
        oculta.faculdadeVisivel = false;
        assertEquals(WidgetCalculo.AULA_DESATIVADA, WidgetCalculo.calcular(oculta, null, "2026-11-18").estadoAula);
    }

    @Test
    public void datas() {
        assertEquals("2026-12-01", WidgetCalculo.somaDias("2026-11-30", 1));
        assertEquals("2027-01-01", WidgetCalculo.somaDias("2026-12-31", 1));
        assertEquals("2028-02-29", WidgetCalculo.somaDias("2028-02-28", 1));
        assertEquals("2026-02-28", WidgetCalculo.somaDias("2026-03-01", -1));
        assertEquals(8, WidgetCalculo.diasEntre("2026-11-18", "2026-11-26"));
        assertEquals(3, WidgetCalculo.diaDaSemana("2026-11-18"));
        assertEquals(0, WidgetCalculo.diaDaSemana("2026-11-22"));
        assertEquals(4, WidgetCalculo.diaDaSemana("1970-01-01"));
    }

    @Test
    public void encurtaTitulo() {
        String longo = "Revisar todos os exercícios de Cálculo e Física antes da prova de sexta";
        String curto = WidgetCalculo.encurtar(longo, 60);
        assertTrue(curto.endsWith("…"));
        assertTrue(curto.length() <= 60);
        assertEquals("Beber água", WidgetCalculo.encurtar("Beber água", 60));
    }

    @Test
    public void jsonComEscapes() {
        Object v = WidgetCalculo.Json.ler("{\"a\":\"x\\u00e7\\\"y\",\"b\":[1,-2.5,true,null],\"c\":{}}");
        assertTrue(v instanceof Map);
        assertEquals("xç\"y", ((Map<?, ?>) v).get("a"));
        assertEquals(0, WidgetCalculo.pendenciasDe("[]").size());
        assertEquals(0, WidgetCalculo.pendenciasDe(null).size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void jsonInvalido() {
        WidgetCalculo.Json.ler("{\"a\":");
    }
}
