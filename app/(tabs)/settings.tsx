import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/index';
import { AppSettings } from '../../src/types/index';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const ACCENT_COLORS = [
  '#7c6aff', '#ff6a8e', '#4ade80',
  '#fbbf24', '#60a5fa', '#f97316',
];

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.secLabel}>{label}</Text>
      <View style={s.secCard}>{children}</View>
    </View>
  );
}

// ─── Row variants ─────────────────────────────────────────────────────────────
function Row({
  icon, iconBg, label, sub, right, onPress, danger = false,
}: {
  icon: string; iconBg: string; label: string; sub?: string;
  right?: React.ReactNode; onPress?: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[s.row, danger && s.rowDanger]}
    >
      <View style={[s.rowIcon, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={s.rowBody}>
        <Text style={[s.rowLabel, danger && s.rowLabelDanger]}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      <View style={s.rowRight}>{right}</View>
    </TouchableOpacity>
  );
}

function RowToggle({
  icon, iconBg, label, sub, value, onValueChange,
}: {
  icon: string; iconBg: string; label: string; sub?: string;
  value: boolean; onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={s.row}>
      <View style={[s.rowIcon, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={s.rowBody}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#26262f', true: '#7c6aff' }}
        thumbColor="#ffffff"
        ios_backgroundColor="#26262f"
      />
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={s.chip}>
      <Text style={s.chipText}>{label}</Text>
    </View>
  );
}

// ─── Accent color picker ──────────────────────────────────────────────────────
function AccentPicker({
  selected, onSelect,
}: { selected: string; onSelect: (c: string) => void }) {
  return (
    <View style={s.accentRow}>
      {ACCENT_COLORS.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onSelect(c)}
          style={[
            s.accentDot,
            { backgroundColor: c },
            selected === c && s.accentDotSelected,
          ]}
          activeOpacity={0.8}
        >
          {selected === c && <Text style={s.accentCheck}>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { settings, updateSettings } = useStore();

  const [notifHabits,   setNotifHabits]   = useState(settings.notificationsEnabled);
  const [notifActivity, setNotifActivity] = useState(false);
  const [notifSummary,  setNotifSummary]  = useState(true);

  const handleUpdate = useCallback((patch: Partial<AppSettings>) => {
    updateSettings(patch);
  }, [updateSettings]);

  const handleAccent = (color: string) => {
    handleUpdate({ accentColor: color });
  };

  const handleExport = () => {
    Alert.alert('Exportar datos', 'Función disponible en la próxima versión.', [{ text: 'OK' }]);
  };

  const handleReset = () => {
    Alert.alert(
      'Borrar todos los datos',
      'Esta acción no se puede deshacer. Se eliminarán hábitos, metas y plantillas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar todo', style: 'destructive', onPress: () => {} },
      ],
    );
  };

  return (
    <SafeAreaView style={s.container}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Ajustes</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Profile ── */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>M</Text>
          </View>
          <View style={s.profileBody}>
            <Text style={s.profileName}>Miguel</Text>
            <Text style={s.profileSub}>INFORMÁTICA · UNAM FES C4 · 2° SEM</Text>
          </View>
          <TouchableOpacity style={s.editBtn} activeOpacity={0.7}>
            <Text style={s.editBtnText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* ── Notificaciones ── */}
        <Section label="NOTIFICACIONES">
          <RowToggle
            icon="🔔" iconBg="rgba(124,106,255,.12)"
            label="Recordatorios de hábitos"
            sub="Notificación diaria a las 9:00 AM"
            value={notifHabits}
            onValueChange={(v) => { setNotifHabits(v); handleUpdate({ notificationsEnabled: v }); }}
          />
          <View style={s.divider} />
          <RowToggle
            icon="⏰" iconBg="rgba(251,191,36,.1)"
            label="Alertas de actividad"
            sub="5 min antes de cada actividad"
            value={notifActivity}
            onValueChange={setNotifActivity}
          />
          <View style={s.divider} />
          <RowToggle
            icon="🎯" iconBg="rgba(74,222,128,.08)"
            label="Resumen diario"
            sub="Cada noche a las 10:00 PM"
            value={notifSummary}
            onValueChange={setNotifSummary}
          />
        </Section>

        {/* ── Apariencia ── */}
        <Section label="APARIENCIA">
          <Row
            icon="🎨" iconBg="rgba(124,106,255,.12)"
            label="Color de acento"
            sub="Toca para cambiar"
            right={<AccentPicker selected={settings.accentColor} onSelect={handleAccent} />}
          />
          <View style={s.divider} />
          <Row
            icon="🌙" iconBg="rgba(255,255,255,.04)"
            label="Tema"
            sub="Siempre oscuro"
            right={<Chip label="Dark" />}
          />
          <View style={s.divider} />
          <Row
            icon="📅" iconBg="rgba(255,255,255,.04)"
            label="Primer día de semana"
            sub="Lunes"
            right={<Chip label="LUN" />}
          />
        </Section>

        {/* ── Datos ── */}
        <Section label="DATOS">
          <Row
            icon="📤" iconBg="rgba(96,165,250,.1)"
            label="Exportar datos"
            sub="JSON · hábitos, metas, plantillas"
            right={<Text style={s.arrow}>›</Text>}
            onPress={handleExport}
          />
          <View style={s.divider} />
          <Row
            icon="📥" iconBg="rgba(74,222,128,.08)"
            label="Importar desde TimeTune"
            sub="Próximamente"
            right={<Text style={[s.arrow, { color: '#26262f' }]}>›</Text>}
          />
          <View style={s.divider} />
          <Row
            icon="☁️" iconBg="rgba(167,139,250,.1)"
            label="Crear respaldo"
            sub="Guardar en archivos del dispositivo"
            right={<Text style={s.arrow}>›</Text>}
            onPress={() => {}}
          />
        </Section>

        {/* ── Acerca de ── */}
        <Section label="ACERCA DE">
          <Row
            icon="⚡" iconBg="rgba(124,106,255,.12)"
            label="Versión"
            right={<Chip label="v0.1.0" />}
          />
          <View style={s.divider} />
          <Row
            icon="🐙" iconBg="rgba(255,255,255,.04)"
            label="GitHub"
            sub="iamhuitron/flowday"
            right={<Text style={s.arrow}>›</Text>}
            onPress={() => {}}
          />
          <View style={s.divider} />
          <Row
            icon="🎓" iconBg="rgba(255,255,255,.04)"
            label="Desarrollado por"
            sub="Miguel · UNAM FES Cuautitlán"
            right={<Text style={s.arrow}>›</Text>}
          />
        </Section>

        {/* ── Zona de peligro ── */}
        <Section label="ZONA DE PELIGRO">
          <Row
            icon="🗑️" iconBg="rgba(248,113,113,.1)"
            label="Borrar todos los datos"
            sub="Esta acción no se puede deshacer"
            right={<Text style={[s.arrow, { color: '#f87171' }]}>›</Text>}
            onPress={handleReset}
            danger
          />
        </Section>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>FlowDay v0.1.0 · MIT License</Text>
          <Text style={s.footerLink}>github.com/iamhuitron/flowday</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0c0c0f' },
  header:          { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  headerTitle:     { fontSize: 18, fontWeight: '600', color: '#eeeef5', letterSpacing: -0.3 },
  scroll:          { flex: 1 },
  scrollContent:   { padding: 16, paddingBottom: 100 },
  // Profile
  profileCard:     { backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar:          { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#7c6aff' },
  avatarText:      { fontSize: 22, fontWeight: '700', color: '#fff' },
  profileBody:     { flex: 1 },
  profileName:     { fontSize: 16, fontWeight: '600', color: '#eeeef5', marginBottom: 3 },
  profileSub:      { fontFamily: MONO, fontSize: 9, color: '#55556a' },
  editBtn:         { padding: 6, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#26262f', backgroundColor: '#1c1c22', flexShrink: 0 },
  editBtnText:     { fontSize: 12, color: '#55556a' },
  // Section
  section:         { marginBottom: 20 },
  secLabel:        { fontFamily: MONO, fontSize: 9, color: '#55556a', letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  secCard:         { backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 14, overflow: 'hidden' },
  divider:         { height: 1, backgroundColor: '#1c1c22', marginLeft: 60 },
  // Row
  row:             { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 14 },
  rowDanger:       {},
  rowIcon:         { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowBody:         { flex: 1, minWidth: 0 },
  rowLabel:        { fontSize: 13, fontWeight: '500', color: '#eeeef5' },
  rowLabelDanger:  { color: '#f87171' },
  rowSub:          { fontSize: 11, color: '#55556a', marginTop: 2 },
  rowRight:        { flexShrink: 0, alignItems: 'flex-end' },
  arrow:           { fontSize: 18, color: '#55556a' },
  // Chip
  chip:            { backgroundColor: '#1c1c22', borderWidth: 1, borderColor: '#26262f', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  chipText:        { fontFamily: MONO, fontSize: 10, color: '#55556a' },
  // Accent picker
  accentRow:       { flexDirection: 'row', gap: 6 },
  accentDot:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  accentDotSelected:{ borderColor: '#ffffff', transform: [{ scale: 1.15 }] },
  accentCheck:     { color: '#fff', fontSize: 10, fontWeight: '700' },
  // Footer
  footer:          { alignItems: 'center', paddingVertical: 16 },
  footerText:      { fontFamily: MONO, fontSize: 10, color: '#26262f', marginBottom: 4 },
  footerLink:      { fontFamily: MONO, fontSize: 10, color: '#55556a' },
});
