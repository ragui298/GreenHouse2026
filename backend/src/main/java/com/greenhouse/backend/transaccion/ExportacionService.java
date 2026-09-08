package com.greenhouse.backend.transaccion;

import com.greenhouse.backend.cliente.TipoCliente;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportacionService {

    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final String[] COLUMNAS = { "Fecha", "Cliente", "Jornada", "Detalle", "Tipo", "Monto" };

    private final TransaccionRepository transaccionRepository;

    public byte[] exportarTransacciones(LocalDateTime desde, LocalDateTime hasta) {
        List<Transaccion> transacciones = transaccionRepository.findConDetallesEntreFechas(desde, hasta);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet hoja = workbook.createSheet("Transacciones");

            CellStyle estiloEncabezado = crearEstiloEncabezado(workbook);
            CellStyle estiloMonto = crearEstiloMonto(workbook);

            escribirEncabezado(hoja, estiloEncabezado);

            int numeroFila = 1;
            BigDecimal total = BigDecimal.ZERO;
            for (Transaccion t : transacciones) {
                escribirFila(hoja, numeroFila++, t, estiloMonto);
                total = total.add(t.getTipo() == TipoTransaccion.CARGO ? t.getMonto() : t.getMonto().negate());
            }

            escribirTotal(hoja, numeroFila + 1, total, estiloEncabezado, estiloMonto);

            for (int i = 0; i < COLUMNAS.length; i++) {
                hoja.autoSizeColumn(i);
            }

            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            workbook.write(salida);
            return salida.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo generar el archivo de Excel", e);
        }
    }

    private CellStyle crearEstiloEncabezado(XSSFWorkbook workbook) {
        CellStyle estilo = workbook.createCellStyle();
        Font fuente = workbook.createFont();
        fuente.setBold(true);
        estilo.setFont(fuente);
        return estilo;
    }

    private CellStyle crearEstiloMonto(XSSFWorkbook workbook) {
        CellStyle estilo = workbook.createCellStyle();
        estilo.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
        return estilo;
    }

    private void escribirEncabezado(Sheet hoja, CellStyle estilo) {
        Row fila = hoja.createRow(0);
        for (int i = 0; i < COLUMNAS.length; i++) {
            Cell celda = fila.createCell(i);
            celda.setCellValue(COLUMNAS[i]);
            celda.setCellStyle(estilo);
        }
    }

    private void escribirFila(Sheet hoja, int numeroFila, Transaccion t, CellStyle estiloMonto) {
        Row fila = hoja.createRow(numeroFila);
        fila.createCell(0).setCellValue(t.getFecha().format(FORMATO_FECHA));
        fila.createCell(1).setCellValue(t.getCliente().getNombre());
        fila.createCell(2).setCellValue(etiquetaJornada(t.getCliente().getTipoCliente()));
        fila.createCell(3).setCellValue(detalle(t));
        fila.createCell(4).setCellValue(t.getTipo() == TipoTransaccion.CARGO ? "Cargo" : "Abono");

        Cell celdaMonto = fila.createCell(5);
        double monto = t.getTipo() == TipoTransaccion.CARGO ? t.getMonto().doubleValue() : -t.getMonto().doubleValue();
        celdaMonto.setCellValue(monto);
        celdaMonto.setCellStyle(estiloMonto);
    }

    private void escribirTotal(Sheet hoja, int numeroFila, BigDecimal total, CellStyle estiloEncabezado, CellStyle estiloMonto) {
        Row fila = hoja.createRow(numeroFila);
        Cell celdaEtiqueta = fila.createCell(3);
        celdaEtiqueta.setCellValue("Total");
        celdaEtiqueta.setCellStyle(estiloEncabezado);

        Cell celdaTotal = fila.createCell(5);
        celdaTotal.setCellValue(total.doubleValue());
        celdaTotal.setCellStyle(estiloMonto);
    }

    private String etiquetaJornada(TipoCliente tipo) {
        if (tipo == null) {
            return "Sin jornada";
        }
        return switch (tipo) {
            case PRIMARIA -> "Primaria";
            case SECUNDARIA -> "Secundaria";
            case NOCTURNO -> "Profesores";
        };
    }

    private String detalle(Transaccion t) {
        if (t.getDescripcion() != null && !t.getDescripcion().isBlank()) {
            return t.getDescripcion().trim();
        }
        if (!t.getDetalles().isEmpty()) {
            return t.getDetalles().size() + " producto(s)";
        }
        return "";
    }
}
