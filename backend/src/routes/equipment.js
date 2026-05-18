const { Router } = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { log } = require('../logger');

const router = Router();
router.use(authenticate);

router.get('/types', (req, res) => res.json(db.prepare('SELECT * FROM equipment_types ORDER BY name').all()));
router.post('/types', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const r = db.prepare('INSERT INTO equipment_types (name, description) VALUES (?, ?)').run(name, description || null);
    res.status(201).json({ id: r.lastInsertRowid, name });
    log(req.user, 'create', 'equipment_type', r.lastInsertRowid, 'Creó el tipo de equipo: ' + name);
  } catch (e) { if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Ya existe' }); throw e; }
});
router.put('/types/:id', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  db.prepare('UPDATE equipment_types SET name = ?, description = ? WHERE id = ?').run(name, description || null, req.params.id);
  res.json({ message: 'Actualizado' });
  log(req.user, 'update', 'equipment_type', req.params.id, 'Actualizó el tipo de equipo: ' + name);
});
router.delete('/types/:id', (req, res) => {
  const used = db.prepare('SELECT COUNT(*) as c FROM models WHERE equipment_type_id = ?').get(req.params.id);
  if (used.c > 0) return res.status(400).json({ error: 'Hay modelos asociados' });
  const { name } = db.prepare('SELECT name FROM equipment_types WHERE id = ?').get(req.params.id) || {};
  db.prepare('DELETE FROM equipment_types WHERE id = ?').run(req.params.id);
  res.json({ message: 'Eliminado' });
  log(req.user, 'delete', 'equipment_type', req.params.id, 'Eliminó el tipo de equipo: ' + name);
});

router.get('/brands', (req, res) => res.json(db.prepare('SELECT * FROM brands ORDER BY name').all()));
router.post('/brands', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  try { const r = db.prepare('INSERT INTO brands (name, description) VALUES (?, ?)').run(name, description || null); res.status(201).json({ id: r.lastInsertRowid, name }); log(req.user, 'create', 'brand', r.lastInsertRowid, 'Creó la marca: ' + name); }
  catch (e) { if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Ya existe' }); throw e; }
});
router.put('/brands/:id', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  db.prepare('UPDATE brands SET name = ?, description = ? WHERE id = ?').run(name, description || null, req.params.id);
  res.json({ message: 'Actualizado' });
  log(req.user, 'update', 'brand', req.params.id, 'Actualizó la marca: ' + name);
});
router.delete('/brands/:id', (req, res) => {
  const used = db.prepare('SELECT COUNT(*) as c FROM models WHERE brand_id = ?').get(req.params.id);
  if (used.c > 0) return res.status(400).json({ error: 'Hay modelos asociados' });
  const { name } = db.prepare('SELECT name FROM brands WHERE id = ?').get(req.params.id) || {};
  db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
  res.json({ message: 'Eliminado' });
  log(req.user, 'delete', 'brand', req.params.id, 'Eliminó la marca: ' + name);
});

router.get('/models', (req, res) => res.json(db.prepare('SELECT m.*, b.name as brand_name, t.name as type_name FROM models m JOIN brands b ON m.brand_id = b.id JOIN equipment_types t ON m.equipment_type_id = t.id ORDER BY t.name, b.name, m.name').all()));
router.post('/models', (req, res) => {
  const { name, brand_id, equipment_type_id, description } = req.body;
  if (!name || !brand_id || !equipment_type_id) return res.status(400).json({ error: 'Nombre, marca y tipo requeridos' });
  try { const r = db.prepare('INSERT INTO models (name, brand_id, equipment_type_id, description) VALUES (?, ?, ?, ?)').run(name, brand_id, equipment_type_id, description || null); res.status(201).json({ id: r.lastInsertRowid }); const brandRow = db.prepare('SELECT name FROM brands WHERE id = ?').get(brand_id); log(req.user, 'create', 'model', r.lastInsertRowid, 'Creó el modelo: ' + name + ' (marca: ' + (brandRow?.name || 'desconocida') + ')'); }
  catch (e) { if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Ya existe para esta marca' }); throw e; }
});
router.put('/models/:id', (req, res) => {
  const { name, brand_id, equipment_type_id, description } = req.body;
  if (!name || !brand_id || !equipment_type_id) return res.status(400).json({ error: 'Nombre, marca y tipo requeridos' });
  db.prepare('UPDATE models SET name = ?, brand_id = ?, equipment_type_id = ?, description = ? WHERE id = ?').run(name, brand_id, equipment_type_id, description || null, req.params.id);
  res.json({ message: 'Actualizado' });
  const brandRow = db.prepare('SELECT name FROM brands WHERE id = ?').get(brand_id);
  log(req.user, 'update', 'model', req.params.id, 'Actualizó el modelo: ' + name + ' (marca: ' + (brandRow?.name || 'desconocida') + ')');
});
router.delete('/models/:id', (req, res) => {
  const used = db.prepare('SELECT COUNT(*) as c FROM inventory WHERE model_id = ?').get(req.params.id);
  if (used.c > 0) return res.status(400).json({ error: 'Hay inventario asociado' });
  const row = db.prepare('SELECT m.name, b.name as brand_name FROM models m JOIN brands b ON m.brand_id = b.id WHERE m.id = ?').get(req.params.id);
  db.prepare('DELETE FROM models WHERE id = ?').run(req.params.id);
  res.json({ message: 'Eliminado' });
  log(req.user, 'delete', 'model', req.params.id, 'Eliminó el modelo: ' + (row?.name || 'desconocido') + ' (marca: ' + (row?.brand_name || 'desconocida') + ')');
});

router.get('/inventory', (req, res) => res.json(db.prepare('SELECT i.*, m.name as model_name, b.name as brand_name, t.name as type_name FROM inventory i JOIN models m ON i.model_id = m.id JOIN brands b ON m.brand_id = b.id JOIN equipment_types t ON m.equipment_type_id = t.id ORDER BY t.name, b.name, m.name').all()));
router.post('/inventory', (req, res) => {
  const { model_id, total_quantity, unit_price, currency, warehouse_location, notes, min_stock } = req.body;
  if (!model_id || total_quantity === undefined) return res.status(400).json({ error: 'Modelo y cantidad requeridos' });
  if (db.prepare('SELECT id FROM inventory WHERE model_id = ?').get(model_id)) return res.status(409).json({ error: 'Ya existe inventario para este modelo' });
  const r = db.prepare('INSERT INTO inventory (model_id, total_quantity, available_quantity, unit_price, currency, warehouse_location, notes, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(model_id, total_quantity, total_quantity, unit_price || 0, currency || 'USD', warehouse_location || null, notes || null, min_stock || 0);
  res.status(201).json({ message: 'Creado' });
  const modelRow = db.prepare('SELECT name FROM models WHERE id = ?').get(model_id);
  log(req.user, 'create', 'inventory', r.lastInsertRowid, 'Añadió ' + total_quantity + ' unidades de ' + (modelRow?.name || 'desconocido') + ' a inventario (precio: ' + (unit_price || 0) + ' ' + (currency || 'USD') + ')');
});
router.put('/inventory/:id', (req, res) => {
  const { total_quantity, unit_price, currency, warehouse_location, notes, min_stock } = req.body;
  const inv = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'No encontrado' });
  const newTotal = total_quantity !== undefined ? total_quantity : inv.total_quantity;
  if (newTotal - inv.reserved_quantity < 0) return res.status(400).json({ error: `No se puede reducir: hay ${inv.reserved_quantity} reservadas` });
  db.prepare('UPDATE inventory SET total_quantity = ?, available_quantity = ?, unit_price = COALESCE(?, unit_price), currency = COALESCE(?, currency), warehouse_location = COALESCE(?, warehouse_location), notes = COALESCE(?, notes), min_stock = COALESCE(?, min_stock) WHERE id = ?').run(newTotal, newTotal - inv.reserved_quantity, unit_price ?? null, currency ?? null, warehouse_location ?? null, notes ?? null, min_stock ?? null, req.params.id);
  res.json({ message: 'Actualizado' });
  const modelRow = db.prepare('SELECT name FROM models WHERE id = ?').get(inv.model_id);
  log(req.user, 'update', 'inventory', req.params.id, 'Actualizó inventario de ' + (modelRow?.name || 'desconocido'));
});
router.delete('/inventory/:id', (req, res) => {
  const inv = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'No encontrado' });
  if (inv.reserved_quantity > 0) return res.status(400).json({ error: 'Hay unidades reservadas' });
  const modelRow = db.prepare('SELECT name FROM models WHERE id = ?').get(inv.model_id);
  db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
  res.json({ message: 'Eliminado' });
  log(req.user, 'delete', 'inventory', req.params.id, 'Eliminó entrada de inventario de ' + (modelRow?.name || 'desconocido'));
});

router.get('/low-stock', (req, res) => {
  const data = db.prepare("SELECT i.*, m.name as model_name, b.name as brand_name FROM inventory i JOIN models m ON i.model_id = m.id JOIN brands b ON m.brand_id = b.id WHERE i.min_stock > 0 AND i.available_quantity <= i.min_stock ORDER BY (i.available_quantity * 1.0 / i.min_stock) ASC").all();
  res.json(data);
});

router.get('/stats', (req, res) => {
  const models = db.prepare('SELECT COUNT(*) as c FROM inventory').get().c;
  const units = db.prepare('SELECT COALESCE(SUM(total_quantity),0) as t, COALESCE(SUM(available_quantity),0) as a, COALESCE(SUM(reserved_quantity),0) as r FROM inventory').get();
  const valueUSD = db.prepare("SELECT COALESCE(SUM(available_quantity * unit_price),0) as v FROM inventory WHERE currency = 'USD'").get().v;
  const valueCUP = db.prepare("SELECT COALESCE(SUM(available_quantity * unit_price),0) as v FROM inventory WHERE currency = 'CUP'").get().v;
  const types = db.prepare('SELECT COUNT(*) as c FROM equipment_types').get().c;
  const soldQty = db.prepare(`SELECT COALESCE(SUM(si.quantity),0) as q FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE s.status NOT IN ('cancelled','pending')`).get().q;
  const revenue = db.prepare(`SELECT COALESCE(SUM(si.subtotal),0) as r FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE s.status NOT IN ('cancelled','pending')`).get().r;
  const lowStock = db.prepare("SELECT COUNT(*) as c FROM inventory WHERE min_stock > 0 AND available_quantity <= min_stock").get().c;
  res.json({ totalModels: models, totalUnits: units.t, availableUnits: units.a, reservedUnits: units.r, inventoryValueUSD: valueUSD, inventoryValueCUP: valueCUP, totalTypes: types, soldEquipment: soldQty, revenue, lowStock });
});

module.exports = router;
