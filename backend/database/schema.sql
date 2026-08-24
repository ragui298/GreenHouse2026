-- Crear la base de datos (ejecutar conectado a 'postgres')
-- CREATE DATABASE greenhouse_db;

-- Las tablas las crea automáticamente Hibernate (ddl-auto=update)
-- al levantar la aplicación por primera vez. Este archivo es solo
-- referencia de la estructura resultante.

-- usuarios: dueño(s) del negocio que inician sesión
-- clientes: personas que fían
-- productos: catálogo opcional de productos
-- transacciones: cargos (fiado) y abonos (pagos) por cliente
-- detalle_transaccion: productos incluidos en una transacción de tipo CARGO
