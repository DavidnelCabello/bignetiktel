const bcrypt = require('bcryptjs');
const db = require('./database');

const exists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (exists) { console.log('Ya hay datos, seed omitido.'); process.exit(0); }

db.prepare('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)').run('admin', bcrypt.hashSync('admin123', 10), 'Super Administrador BigNetiK', 'super_admin');

const it = db.prepare('INSERT OR IGNORE INTO equipment_types (name) VALUES (?)');
['Router', 'Switch', 'ONT', 'OLT', 'CPE', 'Access Point', 'Firewall', 'Módem', 'Antena', 'Repetidor', 'Gateway VoIP', 'Servidor', 'UPS', 'Cámara IP', 'Panel Solar'].forEach(t => it.run(t));

const ib = db.prepare('INSERT OR IGNORE INTO brands (name) VALUES (?)');
[
  'MikroTik', 'Huawei', 'Cisco', 'TP-Link', 'Ubiquiti', 'D-Link', 'ZTE', 'FiberHome',
  'Juniper', 'Fortinet', 'Nokia', 'Aruba (HPE)', 'Grandstream', 'Ruckus', 'Edgecore',
  'Allied Telesis', 'Extreme Networks', 'Netgear', 'Tenda', 'Mercusys', 'Totolink',
  'Ruijie', 'BDCOM', 'VSOL', 'Alcatel-Lucent', 'Dahua', 'Hikvision', 'LG', 'Samsung',
  'APC', 'Eaton', 'Tripp Lite', 'Longi', 'Jinko Solar'
].forEach(b => ib.run(b));

const gb = db.prepare('SELECT id FROM brands WHERE name = ?');
const gt = db.prepare('SELECT id FROM equipment_types WHERE name = ?');
const im = db.prepare('INSERT OR IGNORE INTO models (name, brand_id, equipment_type_id) VALUES (?, ?, ?)');

const modelos = [
  // ============ MIKROTIK ============
  // Routers
  ['RB750Gr3 (hEX)', 'MikroTik', 'Router'], ['RB760iGS (hEX S)', 'MikroTik', 'Router'],
  ['RB3011UiAS-RM', 'MikroTik', 'Router'], ['RB4011iGS+RM', 'MikroTik', 'Router'],
  ['RB5009UG+S+IN', 'MikroTik', 'Router'], ['RB1100AHx4', 'MikroTik', 'Router'],
  ['CCR1009-7G-1C-1S+', 'MikroTik', 'Router'], ['CCR1036-8G-2S+', 'MikroTik', 'Router'],
  ['CCR2004-16G-2S+PC', 'MikroTik', 'Router'], ['CCR2116-12G-4S+', 'MikroTik', 'Router'],
  ['RB941-2nD (hAP lite)', 'MikroTik', 'Router'], ['RB952Ui-5ac2nD (hAP ac lite)', 'MikroTik', 'Router'],
  ['RB962UiGS-5HacT2HnT (hAP ac)', 'MikroTik', 'Router'],
  // Switches
  ['CRS112-8P-4S-IN', 'MikroTik', 'Switch'], ['CRS125-24G-1S-2HnD-IN', 'MikroTik', 'Switch'],
  ['CRS326-24G-2S+RM', 'MikroTik', 'Switch'], ['CRS328-24P-4S+RM', 'MikroTik', 'Switch'],
  ['CRS354-48P-4S+2Q+RM', 'MikroTik', 'Switch'], ['CRS504-4XQ-IN', 'MikroTik', 'Switch'],
  ['CRS510-8XS-2XQ-IN', 'MikroTik', 'Switch'], ['CRS812-DDQ', 'MikroTik', 'Switch'],
  ['CSS610-8P-2S+IN', 'MikroTik', 'Switch'],
  // Access Points
  ['cAP ac (RBcAPGi-5acD2nD)', 'MikroTik', 'Access Point'], ['cAP ax (C52iG-5HaxD2HaxD-TC)', 'MikroTik', 'Access Point'],
  ['wAP ac (RBwAPG-5HacD2HnD)', 'MikroTik', 'Access Point'], ['wAP ax LTE7 kit', 'MikroTik', 'Access Point'],
  ['hAP ax²', 'MikroTik', 'Access Point'], ['hAP ax³', 'MikroTik', 'Access Point'],
  ['mAP 2nD (mAP lite)', 'MikroTik', 'Access Point'],
  // Antenas
  ['LHG 5 (RBLHG-5nD)', 'MikroTik', 'Antena'], ['LHG XL 5 (RBLHGXL-5nD)', 'MikroTik', 'Antena'],
  ['SXTsq 5 ac (RBSXTsq5nD)', 'MikroTik', 'Antena'], ['DynaDish 5 (RBDynaDishG-5HacD)', 'MikroTik', 'Antena'],
  ['mANTBox 15s (RBmAntBox-15s)', 'MikroTik', 'Antena'], ['Cube 60Pro ac (RBCube60Pro)', 'MikroTik', 'Antena'],
  ['Wireless Wire (RBwAPR-2nD)', 'MikroTik', 'Antena'],
  // CPE
  ['SXT LTE6 kit (RBSXTR&R11e-LTE6)', 'MikroTik', 'CPE'], ['Chateau 5G (RBChateau5G)', 'MikroTik', 'CPE'],
  ['hAP ac LTE6 kit', 'MikroTik', 'CPE'], ['LtAP mini', 'MikroTik', 'CPE'],
  // Firewall
  ['RB1100AHx4 Dude Edition', 'MikroTik', 'Firewall'],

  // ============ HUAWEI ============
  // Routers
  ['AR161W-S', 'Huawei', 'Router'], ['AR2200-S', 'Huawei', 'Router'], ['AR651W-LTE', 'Huawei', 'Router'],
  ['NetEngine AR6700', 'Huawei', 'Router'], ['NetEngine 8000 M14', 'Huawei', 'Router'],
  ['WiFi AX3 Pro', 'Huawei', 'Router'], ['B535-333', 'Huawei', 'Router'], ['B618s-22d', 'Huawei', 'Router'],
  ['B525s-65a', 'Huawei', 'Router'],
  // Switches
  ['S1700-24GR', 'Huawei', 'Switch'], ['S2700-26TP-SI', 'Huawei', 'Switch'],
  ['S5700-48P-LI-AC', 'Huawei', 'Switch'], ['S5720-36PC-EI-AC', 'Huawei', 'Switch'],
  ['S6720-32X-SI-32S', 'Huawei', 'Switch'], ['CE6850-48S4Q-EI', 'Huawei', 'Switch'],
  ['CloudEngine S5735-L48P4XE', 'Huawei', 'Switch'],
  // ONT
  ['EchoLife HG8010H', 'Huawei', 'ONT'], ['EchoLife HG8120L', 'Huawei', 'ONT'],
  ['EchoLife EG8040H5', 'Huawei', 'ONT'], ['EchoLife EG8240H5', 'Huawei', 'ONT'],
  ['EchoLife HG8245H5', 'Huawei', 'ONT'], ['EchoLife HG8247H5', 'Huawei', 'ONT'],
  ['EchoLife HG8245Q2', 'Huawei', 'ONT'], ['EchoLife HN8245Q', 'Huawei', 'ONT'],
  ['OptiXstar HG8145V5', 'Huawei', 'ONT'], ['OptiXstar HG8346M', 'Huawei', 'ONT'],
  ['OptiXstar EA5821', 'Huawei', 'ONT'],
  // OLT
  ['SmartAX MA5608T', 'Huawei', 'OLT'], ['SmartAX MA5800-X2', 'Huawei', 'OLT'],
  ['SmartAX MA5800-X7', 'Huawei', 'OLT'], ['SmartAX MA5800-X15', 'Huawei', 'OLT'],
  ['SmartAX MA5800-X17', 'Huawei', 'OLT'],
  // CPE
  ['B310s-22', 'Huawei', 'CPE'], ['B715s-23c', 'Huawei', 'CPE'], ['E5785 (MiFi)', 'Huawei', 'CPE'],
  // Firewall
  ['USG6305E', 'Huawei', 'Firewall'], ['USG6500E', 'Huawei', 'Firewall'],
  ['USG6600E', 'Huawei', 'Firewall'], ['USG6700E', 'Huawei', 'Firewall'],
  // Access Point
  ['AP4030DN', 'Huawei', 'Access Point'], ['AP6050DN', 'Huawei', 'Access Point'],
  ['AP7060DN', 'Huawei', 'Access Point'], ['AirEngine 5762-12', 'Huawei', 'Access Point'],

  // ============ CISCO ============
  // Routers
  ['Cisco 1100 ISR', 'Cisco', 'Router'], ['Cisco 4300 ISR', 'Cisco', 'Router'],
  ['Cisco 4500 ISR', 'Cisco', 'Router'], ['Cisco ASR 1001-HX', 'Cisco', 'Router'],
  ['Cisco ASR 9006', 'Cisco', 'Router'], ['Cisco 8200L', 'Cisco', 'Router'],
  ['RV340 Dual WAN', 'Cisco', 'Router'],
  // Switches
  ['Catalyst 1000-8T', 'Cisco', 'Switch'], ['Catalyst 1000-48T-4G-L', 'Cisco', 'Switch'],
  ['Catalyst 1200-8P', 'Cisco', 'Switch'], ['Catalyst 1300-24P', 'Cisco', 'Switch'],
  ['Catalyst 9200-24P', 'Cisco', 'Switch'], ['Catalyst 9300-24T', 'Cisco', 'Switch'],
  ['Catalyst 9300-48P', 'Cisco', 'Switch'], ['Catalyst 9400-24', 'Cisco', 'Switch'],
  ['Catalyst 9500X-28C', 'Cisco', 'Switch'], ['Catalyst 9600-36', 'Cisco', 'Switch'],
  ['Nexus 9000 (N9K-C93180LC)', 'Cisco', 'Switch'],
  // Firewall
  ['ASA 5506-X', 'Cisco', 'Firewall'], ['ASA 5516-X', 'Cisco', 'Firewall'],
  ['Firepower 1010', 'Cisco', 'Firewall'], ['Firepower 1120', 'Cisco', 'Firewall'],
  ['Firepower 2100', 'Cisco', 'Firewall'], ['Firepower 4100', 'Cisco', 'Firewall'],
  ['Meraki MX67', 'Cisco', 'Firewall'], ['Meraki MX95', 'Cisco', 'Firewall'],
  // Access Point
  ['Meraki MR36', 'Cisco', 'Access Point'], ['Meraki MR46', 'Cisco', 'Access Point'],
  ['Catalyst 9105AXI', 'Cisco', 'Access Point'], ['Catalyst 9117AXI', 'Cisco', 'Access Point'],
  ['Catalyst 9120AXI', 'Cisco', 'Access Point'],
  // Módem
  ['DCM-475', 'Cisco', 'Módem'], ['DPC3848VM', 'Cisco', 'Módem'],

  // ============ TP-LINK ============
  // Routers
  ['Archer AX23 (AX1800)', 'TP-Link', 'Router'], ['Archer AX53 (AX3000)', 'TP-Link', 'Router'],
  ['Archer AX73 (AX5400)', 'TP-Link', 'Router'], ['Archer AX11000', 'TP-Link', 'Router'],
  ['Archer C6 (AC1200)', 'TP-Link', 'Router'], ['Archer C80 (AC1900)', 'TP-Link', 'Router'],
  ['Archer VR800', 'TP-Link', 'Router'], ['TL-R605', 'TP-Link', 'Router'],
  ['TL-R470T+', 'TP-Link', 'Router'], ['Archer BE550 (BE9300)', 'TP-Link', 'Router'],
  // Switches
  ['TL-SG1005D', 'TP-Link', 'Switch'], ['TL-SG1008D', 'TP-Link', 'Switch'],
  ['TL-SG1016D', 'TP-Link', 'Switch'], ['TL-SG1024D', 'TP-Link', 'Switch'],
  ['TL-SG1210MPE', 'TP-Link', 'Switch'], ['TL-SG2210P', 'TP-Link', 'Switch'],
  ['TL-SG3428X', 'TP-Link', 'Switch'], ['TL-SG5452PE', 'TP-Link', 'Switch'],
  ['TL-SX1008', 'TP-Link', 'Switch'], ['JetStream T3700G-28TQ', 'TP-Link', 'Switch'],
  // Access Point
  ['EAP225 (AC1350)', 'TP-Link', 'Access Point'], ['EAP225-Outdoor', 'TP-Link', 'Access Point'],
  ['EAP235-Wall (AC1200)', 'TP-Link', 'Access Point'], ['EAP610 (AX1800)', 'TP-Link', 'Access Point'],
  ['EAP650 (AX3000)', 'TP-Link', 'Access Point'], ['EAP660 HD (AX3600)', 'TP-Link', 'Access Point'],
  ['EAP670 (AX5400)', 'TP-Link', 'Access Point'], ['EAP690E HD (AX11000)', 'TP-Link', 'Access Point'],
  ['EAP115 (AC300)', 'TP-Link', 'Access Point'],
  // Módem
  ['TD-W9970', 'TP-Link', 'Módem'], ['TD-W8961N', 'TP-Link', 'Módem'],
  ['Archer MR600 (4G+)', 'TP-Link', 'Módem'], ['TL-MR3020', 'TP-Link', 'Módem'],
  // CPE
  ['CPE510', 'TP-Link', 'CPE'], ['CPE610', 'TP-Link', 'CPE'], ['CPE710', 'TP-Link', 'CPE'],
  ['TL-WA5210G', 'TP-Link', 'CPE'], ['TL-WA7510N', 'TP-Link', 'CPE'],
  // Repetidor
  ['RE200 (AC750)', 'TP-Link', 'Repetidor'], ['RE305 (AC1200)', 'TP-Link', 'Repetidor'],
  ['RE450 (AC1750)', 'TP-Link', 'Repetidor'], ['RE650 (AC2600)', 'TP-Link', 'Repetidor'],
  ['RE705X (AX3000)', 'TP-Link', 'Repetidor'],

  // ============ UBIQUITI ============
  // Routers
  ['EdgeRouter X', 'Ubiquiti', 'Router'], ['EdgeRouter 4', 'Ubiquiti', 'Router'],
  ['EdgeRouter 12', 'Ubiquiti', 'Router'], ['UniFi Cloud Gateway Ultra', 'Ubiquiti', 'Router'],
  ['UniFi Dream Machine (UDM)', 'Ubiquiti', 'Router'], ['UniFi Dream Machine Pro (UDM-Pro)', 'Ubiquiti', 'Router'],
  ['UniFi Dream Router 7 (UDR7)', 'Ubiquiti', 'Router'],
  // Switches
  ['USW-Flex-Mini', 'Ubiquiti', 'Switch'], ['USW-Lite-8-PoE', 'Ubiquiti', 'Switch'],
  ['USW-24-PoE Gen2', 'Ubiquiti', 'Switch'], ['USW-48-PoE Gen2', 'Ubiquiti', 'Switch'],
  ['USW-Pro-24-PoE', 'Ubiquiti', 'Switch'], ['USW-Pro-48-PoE', 'Ubiquiti', 'Switch'],
  ['USW-Pro-XG-48-PoE', 'Ubiquiti', 'Switch'], ['USW-Aggregation-Pro', 'Ubiquiti', 'Switch'],
  // Access Point
  ['UAP-AC-Lite', 'Ubiquiti', 'Access Point'], ['UAP-AC-LR', 'Ubiquiti', 'Access Point'],
  ['UAP-AC-Pro', 'Ubiquiti', 'Access Point'], ['UAP-AC-Mesh (outdoor)', 'Ubiquiti', 'Access Point'],
  ['UAP-FlexHD', 'Ubiquiti', 'Access Point'], ['U6-Lite', 'Ubiquiti', 'Access Point'],
  ['U6-LR', 'Ubiquiti', 'Access Point'], ['U6-Pro', 'Ubiquiti', 'Access Point'],
  ['U6-Enterprise', 'Ubiquiti', 'Access Point'], ['U7-Lite (WiFi 7)', 'Ubiquiti', 'Access Point'],
  ['U7-LR (WiFi 7)', 'Ubiquiti', 'Access Point'],
  // Antenas
  ['LiteBeam 5AC Gen2', 'Ubiquiti', 'Antena'], ['LiteBeam M5', 'Ubiquiti', 'Antena'],
  ['NanoBeam 5AC Gen2', 'Ubiquiti', 'Antena'], ['NanoStation 5AC Loco', 'Ubiquiti', 'Antena'],
  ['PowerBeam 5AC Gen2', 'Ubiquiti', 'Antena'], ['Rocket 5AC Prism', 'Ubiquiti', 'Antena'],
  ['RocketDish RD-5G30-LW', 'Ubiquiti', 'Antena'],
  // CPE
  ['UFiber GPON ONU (UF-WIFI)', 'Ubiquiti', 'CPE'], ['UFiber Loco (UF-LOCO)', 'Ubiquiti', 'CPE'],
  ['UniFi LTE Backup', 'Ubiquiti', 'CPE'],
  // Gateway VoIP
  ['UniFi VoIP Phone', 'Ubiquiti', 'Gateway VoIP'],

  // ============ D-LINK ============
  // Routers
  ['DIR-300', 'D-Link', 'Router'], ['DIR-615', 'D-Link', 'Router'], ['DIR-822', 'D-Link', 'Router'],
  ['DIR-867', 'D-Link', 'Router'], ['DIR-882', 'D-Link', 'Router'], ['DIR-X1560', 'D-Link', 'Router'],
  ['DIR-1950 (AC1900)', 'D-Link', 'Router'], ['R95 (BE9500)', 'D-Link', 'Router'],
  ['M95 (BE9500 Mesh)', 'D-Link', 'Router'], ['G572 (5G BE7200)', 'D-Link', 'Router'],
  ['DVA-2800', 'D-Link', 'Router'],
  // Switches
  ['DGS-1008A', 'D-Link', 'Switch'], ['DGS-1016A', 'D-Link', 'Switch'],
  ['DGS-1024A', 'D-Link', 'Switch'], ['DGS-1100-08P', 'D-Link', 'Switch'],
  ['DGS-1210-28P', 'D-Link', 'Switch'], ['DGS-1510-28X', 'D-Link', 'Switch'],
  ['DGS-3000-28L', 'D-Link', 'Switch'], ['DXS-1210-10TS', 'D-Link', 'Switch'],
  // Access Point
  ['DAP-1325 (Range Extender)', 'D-Link', 'Access Point'], ['DAP-2610 (AC1300)', 'D-Link', 'Access Point'],
  ['DAP-2682 (AC2300)', 'D-Link', 'Access Point'], ['DAP-X2810 (AX1800)', 'D-Link', 'Access Point'],
  ['DAP-X3060 (AX3000)', 'D-Link', 'Access Point'], ['DAP-3666 (Outdoor)', 'D-Link', 'Access Point'],
  // Módem
  ['DWR-953 (4G)', 'D-Link', 'Módem'], ['DWR-978 (4G+)', 'D-Link', 'Módem'],
  ['DWM-222 (USB Modem)', 'D-Link', 'Módem'],
  // Cámara IP
  ['DCS-8302L', 'D-Link', 'Cámara IP'], ['DCS-8330LH', 'D-Link', 'Cámara IP'],
  ['DCS-8526LH', 'D-Link', 'Cámara IP'],

  // ============ ZTE ============
  // Routers
  ['ZTE F680', 'ZTE', 'Router'], ['ZTE G5 Ultra MC8531', 'ZTE', 'Router'],
  ['ZTE G5 Pro MC8532B', 'ZTE', 'Router'], ['ZTE MC801A Pro', 'ZTE', 'Router'],
  ['ZTE MC888 Ultra', 'ZTE', 'Router'], ['ZTE T3000 WiFi 6', 'ZTE', 'Router'],
  ['ZTE AX3000', 'ZTE', 'Router'],
  // ONT
  ['ZTE F600', 'ZTE', 'ONT'], ['ZTE F660', 'ZTE', 'ONT'], ['ZTE F670', 'ZTE', 'ONT'],
  ['ZTE F673A', 'ZTE', 'ONT'], ['ZTE F680 (ONT mode)', 'ZTE', 'ONT'],
  ['ZTE F8648P', 'ZTE', 'ONT'], ['ZTE F869', 'ZTE', 'ONT'],
  // OLT
  ['ZXA10 C300', 'ZTE', 'OLT'], ['ZXA10 C320', 'ZTE', 'OLT'],
  ['ZXA10 C600', 'ZTE', 'OLT'], ['ZXA10 C650', 'ZTE', 'OLT'],
  ['ZXA10 C620', 'ZTE', 'OLT'],
  // Switches
  ['ZTE 5228C', 'ZTE', 'Switch'], ['ZTE 5952', 'ZTE', 'Switch'],
  // CPE
  ['ZTE MC7010 (Outdoor 5G)', 'ZTE', 'CPE'], ['ZTE MC889 (Outdoor 5G)', 'ZTE', 'CPE'],
  ['ZTE MU5120 (MiFi 5G)', 'ZTE', 'CPE'], ['ZTE F50 (Pocket WiFi)', 'ZTE', 'CPE'],
  // Módem
  ['ZTE MF920U', 'ZTE', 'Módem'], ['ZTE MF971V', 'ZTE', 'Módem'],

  // ============ FIBERHOME ============
  // ONT
  ['AN5506-01-A1', 'FiberHome', 'ONT'], ['AN5506-02-F1', 'FiberHome', 'ONT'],
  ['AN5506-04-F1', 'FiberHome', 'ONT'], ['AN5506-06-F1', 'FiberHome', 'ONT'],
  ['AN5506-08-F2', 'FiberHome', 'ONT'], ['AN5526-10', 'FiberHome', 'ONT'],
  // OLT
  ['AN5516-01', 'FiberHome', 'OLT'], ['AN5516-04', 'FiberHome', 'OLT'],
  ['AN5516-06', 'FiberHome', 'OLT'], ['AN6001-G16', 'FiberHome', 'OLT'],
  ['AN6000-17', 'FiberHome', 'OLT'],
  // Router
  ['FiberHome G1100', 'FiberHome', 'Router'],
  // CPE
  ['FiberHome 4G CPE', 'FiberHome', 'CPE'],

  // ============ JUNIPER ============
  // Router
  ['Juniper SRX300', 'Juniper', 'Router'], ['Juniper SRX1500', 'Juniper', 'Router'],
  ['Juniper MX204', 'Juniper', 'Router'], ['Juniper MX480', 'Juniper', 'Router'],
  // Firewall
  ['JunOS SRX320', 'Juniper', 'Firewall'], ['JunOS SRX550M', 'Juniper', 'Firewall'],
  // Switch
  ['EX2300-C-12P', 'Juniper', 'Switch'], ['EX3400-24P', 'Juniper', 'Switch'],
  ['EX4300-48P', 'Juniper', 'Switch'], ['QFX5110-48S', 'Juniper', 'Switch'],

  // ============ FORTINET ============
  // Firewall
  ['FortiGate 40F', 'Fortinet', 'Firewall'], ['FortiGate 60E', 'Fortinet', 'Firewall'],
  ['FortiGate 80F', 'Fortinet', 'Firewall'], ['FortiGate 100F', 'Fortinet', 'Firewall'],
  ['FortiGate 200F', 'Fortinet', 'Firewall'], ['FortiGate 400F', 'Fortinet', 'Firewall'],
  ['FortiGate 600F', 'Fortinet', 'Firewall'], ['FortiGate 900G', 'Fortinet', 'Firewall'],
  // Switch
  ['FortiSwitch 108F-POE', 'Fortinet', 'Switch'], ['FortiSwitch 224D-POE', 'Fortinet', 'Switch'],
  ['FortiSwitch 424E-POE', 'Fortinet', 'Switch'], ['FortiSwitch 548D-FPOE', 'Fortinet', 'Switch'],
  // Access Point
  ['FortiAP 231F', 'Fortinet', 'Access Point'], ['FortiAP 431F', 'Fortinet', 'Access Point'],
  ['FortiAP 831F', 'Fortinet', 'Access Point'],

  // ============ NOKIA ============
  // ONT
  ['Nokia ONT G-010G-P', 'Nokia', 'ONT'], ['Nokia ONT G-240W-G', 'Nokia', 'ONT'],
  ['Nokia ONT G-2426G-A', 'Nokia', 'ONT'], ['Nokia Beacon 1 (WiFi 5)', 'Nokia', 'ONT'],
  ['Nokia Beacon 2 (WiFi 6)', 'Nokia', 'ONT'],
  // OLT
  ['Nokia 7360 ISAM FX-16', 'Nokia', 'OLT'], ['Nokia 7368 ISAM S-8', 'Nokia', 'OLT'],
  ['Nokia 7368 ISAM FX-4', 'Nokia', 'OLT'],
  // Router
  ['Nokia 7750 SR-1', 'Nokia', 'Router'],

  // ============ ARUBA (HPE) ============
  // Access Point
  ['Aruba AP-303H', 'Aruba (HPE)', 'Access Point'], ['Aruba AP-315', 'Aruba (HPE)', 'Access Point'],
  ['Aruba AP-505', 'Aruba (HPE)', 'Access Point'], ['Aruba AP-515', 'Aruba (HPE)', 'Access Point'],
  ['Aruba AP-535', 'Aruba (HPE)', 'Access Point'], ['Aruba AP-555', 'Aruba (HPE)', 'Access Point'],
  ['Aruba AP-635 (WiFi 6E)', 'Aruba (HPE)', 'Access Point'], ['Aruba AP-655 (WiFi 6E)', 'Aruba (HPE)', 'Access Point'],
  // Switch
  ['Aruba 1930-8G', 'Aruba (HPE)', 'Switch'], ['Aruba 2930F-24G', 'Aruba (HPE)', 'Switch'],
  ['Aruba 2930M-48G', 'Aruba (HPE)', 'Switch'], ['Aruba CX 8325', 'Aruba (HPE)', 'Switch'],
  // Router
  ['Aruba 7205', 'Aruba (HPE)', 'Router'], ['Aruba 7280', 'Aruba (HPE)', 'Router'],

  // ============ GRANDSTREAM ============
  // Gateway VoIP
  ['Grandstream HT812', 'Grandstream', 'Gateway VoIP'], ['Grandstream HT818', 'Grandstream', 'Gateway VoIP'],
  ['Grandstream UCM6202', 'Grandstream', 'Gateway VoIP'], ['Grandstream UCM6302', 'Grandstream', 'Gateway VoIP'],
  ['Grandstream GXP2170 (IP Phone)', 'Grandstream', 'Gateway VoIP'],
  // Router
  ['Grandstream GWN7002', 'Grandstream', 'Router'], ['Grandstream GWN7610', 'Grandstream', 'Router'],

  // ============ RUCKUS ============
  // Access Point
  ['Ruckus R310', 'Ruckus', 'Access Point'], ['Ruckus R510', 'Ruckus', 'Access Point'],
  ['Ruckus R610', 'Ruckus', 'Access Point'], ['Ruckus R710', 'Ruckus', 'Access Point'],
  ['Ruckus R750 (WiFi 6)', 'Ruckus', 'Access Point'], ['Ruckus T710 (Outdoor)', 'Ruckus', 'Access Point'],
  // Switch
  ['Ruckus ICX 7150-C12P', 'Ruckus', 'Switch'], ['Ruckus ICX 7450-48P', 'Ruckus', 'Switch'],

  // ============ EDGECORE ============
  // Switch
  ['Edgecore AS4610-54P', 'Edgecore', 'Switch'], ['Edgecore AS7315-30X', 'Edgecore', 'Switch'],
  ['Edgecore AS7716-32X', 'Edgecore', 'Switch'], ['Edgecore AS9726-32DB', 'Edgecore', 'Switch'],

  // ============ NETGEAR ============
  // Router
  ['Netgear R6700 (AC1750)', 'Netgear', 'Router'], ['Netgear R7000 (AC1900)', 'Netgear', 'Router'],
  ['Netgear RAX50 (AX5400)', 'Netgear', 'Router'], ['Netgear RAX200 (AX11000)', 'Netgear', 'Router'],
  ['Netgear Orbi RBK852', 'Netgear', 'Router'], ['Netgear Nighthawk M5 (5G)', 'Netgear', 'Router'],
  // Switch
  ['Netgear GS108', 'Netgear', 'Switch'], ['Netgear GS316PP', 'Netgear', 'Switch'],
  ['Netgear GS724TP', 'Netgear', 'Switch'], ['Netgear GS752TP', 'Netgear', 'Switch'],
  ['Netgear M4300-96X', 'Netgear', 'Switch'],
  // Access Point
  ['Netgear WAX610 (AX1800)', 'Netgear', 'Access Point'], ['Netgear WAX630 (AX6000)', 'Netgear', 'Access Point'],

  // ============ TENDA ============
  ['Tenda AC10 (AC1200)', 'Tenda', 'Router'], ['Tenda AC23 (AC2100)', 'Tenda', 'Router'],
  ['Tenda AC8 (AC1200)', 'Tenda', 'Router'], ['Tenda RX3 (AX3000)', 'Tenda', 'Router'],
  ['Tenda MW6 (Mesh AC1200)', 'Tenda', 'Router'],
  // Switch
  ['Tenda SG108', 'Tenda', 'Switch'], ['Tenda SG116', 'Tenda', 'Switch'],
  ['Tenda TEG1016D', 'Tenda', 'Switch'],
  // CPE
  ['Tenda O3 (Outdoor CPE)', 'Tenda', 'CPE'], ['Tenda O5 (Outdoor CPE)', 'Tenda', 'CPE'],
  ['Tenda O6 (Outdoor CPE)', 'Tenda', 'CPE'],

  // ============ MERCUSYS ============
  ['Mercusys MR50G (AC1900)', 'Mercusys', 'Router'], ['Mercusys MR70X (AX3000)', 'Mercusys', 'Router'],
  ['Mercusys HALO H80X (Mesh)', 'Mercusys', 'Router'], ['Mercusys MS105G', 'Mercusys', 'Switch'],
  ['Mercusys MS108G', 'Mercusys', 'Switch'],

  // ============ TOTOLINK ============
  ['Totolink A3002RU', 'Totolink', 'Router'], ['Totolink A7000 (WiFi 6)', 'Totolink', 'Router'],
  ['Totolink A850R', 'Totolink', 'Router'], ['Totolink A950RG', 'Totolink', 'Router'],

  // ============ RUIJIE ============
  ['Ruijie RG-EW1200', 'Ruijie', 'Router'], ['Ruijie RG-EAP212', 'Ruijie', 'Access Point'],
  ['Ruijie RG-S2928G-E V3', 'Ruijie', 'Switch'], ['Ruijie RG-NBS5710-24GT4SFP', 'Ruijie', 'Switch'],

  // ============ BDCOM ============
  ['BDCOM GP3600-04L (OLT)', 'BDCOM', 'OLT'], ['BDCOM GP1704-4G-22A (ONT)', 'BDCOM', 'ONT'],
  ['BDCOM P1004G-22A (ONT)', 'BDCOM', 'ONT'], ['BDCOM S2000-24P', 'BDCOM', 'Switch'],

  // ============ VSOL ============
  ['VSOL GPON ONU V1600D', 'VSOL', 'ONT'], ['VSOL GPON ONU V2802RG', 'VSOL', 'ONT'],
  ['VSOL OLT V3800-04', 'VSOL', 'OLT'],

  // ============ ALCATEL-LUCENT ============
  ['Alcatel-Lucent I-211M-L', 'Alcatel-Lucent', 'ONT'], ['Alcatel-Lucent G-240W-A', 'Alcatel-Lucent', 'ONT'],
  ['Alcatel-Lucent G-2426G-A', 'Alcatel-Lucent', 'ONT'], ['Alcatel-Lucent OS6450-24', 'Alcatel-Lucent', 'Switch'],

  // ============ DAHUA ============
  ['Dahua IPC-HFW1230S (2MP)', 'Dahua', 'Cámara IP'], ['Dahua IPC-HDW2130S (2MP)', 'Dahua', 'Cámara IP'],
  ['Dahua IPC-HFW4431M (4MP)', 'Dahua', 'Cámara IP'], ['Dahua IPC-HDBW2831R-S (8MP)', 'Dahua', 'Cámara IP'],
  ['Dahua NVR4104-4KS2', 'Dahua', 'Servidor'], ['Dahua NVR5208-4KS2', 'Dahua', 'Servidor'],
  ['Dahua DHI-VTO2000A (Video Portero)', 'Dahua', 'Gateway VoIP'],
  // Switch PoE
  ['Dahua DH-PFS3006-4ET-60', 'Dahua', 'Switch'], ['Dahua DH-PFS3108-8ET-96', 'Dahua', 'Switch'],

  // ============ HIKVISION ============
  ['Hikvision DS-2CD1023G0E (2MP)', 'Hikvision', 'Cámara IP'],
  ['Hikvision DS-2CD2347G2-LU (4MP)', 'Hikvision', 'Cámara IP'],
  ['Hikvision DS-2CD2T87WD (8MP)', 'Hikvision', 'Cámara IP'],
  ['Hikvision DS-7604NI-K1 (NVR)', 'Hikvision', 'Servidor'],
  ['Hikvision DS-7616NI-I2 (NVR)', 'Hikvision', 'Servidor'],

  // ============ LG ============
  ['LG UHD TV 43"', 'LG', 'Cámara IP'], ['LG Monitor 24"', 'LG', 'Servidor'],

  // ============ SAMSUNG ============
  ['Samsung Monitor 22"', 'Samsung', 'Servidor'], ['Samsung SSD 870 EVO', 'Samsung', 'Servidor'],

  // ============ APC ============
  ['APC Back-UPS BE650G1', 'APC', 'UPS'], ['APC Back-UPS BE850G2', 'APC', 'UPS'],
  ['APC Smart-UPS SMC1000C', 'APC', 'UPS'], ['APC Smart-UPS SMT1500I', 'APC', 'UPS'],
  ['APC Smart-UPS SRV3000', 'APC', 'UPS'], ['APC Rack PDU 2G', 'APC', 'UPS'],

  // ============ EATON ============
  ['Eaton 5S 850', 'Eaton', 'UPS'], ['Eaton 5E 1100', 'Eaton', 'UPS'],
  ['Eaton 9PX 1500', 'Eaton', 'UPS'], ['Eaton 9SX 2000', 'Eaton', 'UPS'],

  // ============ TRIPP LITE ============
  ['Tripp Lite SMART1500LCD', 'Tripp Lite', 'UPS'], ['Tripp Lite SU1000XLA', 'Tripp Lite', 'UPS'],
  ['Tripp Lite SU2200RTXL2U', 'Tripp Lite', 'UPS'],

  // ============ PANELES SOLARES ============
  ['Longi LR5-72HTH-540M', 'Longi', 'Panel Solar'], ['Longi LR5-72HPH-550M', 'Longi', 'Panel Solar'],
  ['Longi LR4-60HPH-375M', 'Longi', 'Panel Solar'],
  ['Jinko Solar JKM540M-72HL4', 'Jinko Solar', 'Panel Solar'],
  ['Jinko Solar JKM455M-54HL4', 'Jinko Solar', 'Panel Solar'],
  ['Jinko Solar JKM410M-60HL3', 'Jinko Solar', 'Panel Solar'],
];

for (const [n, b, t] of modelos) {
  const bi = gb.get(b), ti = gt.get(t);
  if (bi && ti) im.run(n, bi.id, ti.id);
}

console.log(`Seed completado: admin/admin123 + ${modelos.length} modelos en catálogo`);
