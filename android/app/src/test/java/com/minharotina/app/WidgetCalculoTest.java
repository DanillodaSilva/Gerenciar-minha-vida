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
        assertEquals(12, r.folhas);
        assertEquals(0, r.sequencia);
        assertEquals(3, r.estagio);
        assertEquals("Arvoreta", r.nomeEstagio);
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
        assertEquals(13, r.folhas);
        assertEquals(6, r.sequencia);
        assertEquals(4, r.totalHoje);
        assertEquals(1, r.feitosHoje);
        assertEquals(25, r.pctHoje);
    }

    @Test
    public void mesmoDiaDoRetrato() {
        WidgetCalculo.Resultado r = WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-18");
        assertEquals(13, r.folhas);
        assertEquals(5, r.sequencia);
        assertEquals(4, r.feitosHoje);
        assertEquals(100, r.pctHoje);
    }

    @Test
    public void viradaDeDoisDias() {
        WidgetCalculo.Resultado r = WidgetCalculo.calcular(retrato(), pendencias(), "2026-11-20");
        assertEquals(12, r.folhas);
        assertEquals(0, r.sequencia);
        assertEquals(3, r.estagio);
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
        assertEquals(10, antes.folhas);
        assertEquals(antes.folhas, depois.folhas);
        assertEquals(antes.sequencia, depois.sequencia);
        assertEquals(0, antes.totalHoje);

        WidgetCalculo.Retrato r = new WidgetCalculo.Retrato();
        r.hoje = "2026-11-22";
        r.dias.add(new WidgetCalculo.Dia("2026-11-22"));
        WidgetCalculo.Dia d23 = new WidgetCalculo.Dia("2026-11-23");
        d23.itens.add(new WidgetCalculo.Item("a", "rotina", "A", "", false));
        r.dias.add(d23);
        r.folhasAteOntem = 5;
        r.sequenciaAteOntem = 3;
        r.estagios = new int[] {0, 1, 3, 7};
        r.nomes = new String[] {"Semente", "Broto", "Muda", "Arvoreta"};
        WidgetCalculo.Resultado x = WidgetCalculo.calcular(r, null, "2026-11-23");
        assertEquals(5, x.folhas);
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
    public void meioFeitoNaoPerdeNemGanha() {
        WidgetCalculo.Retrato r = new WidgetCalculo.Retrato();
        r.hoje = "2026-11-18";
        WidgetCalculo.Dia d = new WidgetCalculo.Dia("2026-11-18");
        d.itens.add(new WidgetCalculo.Item("a", "rotina", "A", "", true));
        d.itens.add(new WidgetCalculo.Item("b", "rotina", "B", "", false));
        r.dias.add(d);
        r.folhasAteOntem = 4;
        r.sequenciaAteOntem = 2;
        WidgetCalculo.Resultado x = WidgetCalculo.calcular(r, null, "2026-11-19");
        assertEquals(4, x.folhas);
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
