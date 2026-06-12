import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore }        from '../../src/store/index';
import { useTheme }        from '../../src/hooks/useTheme';
import { AppSettings }     from '../../src/types/index';
import {
  scheduleHabitReminder, scheduleDailySummary,
  scheduleActivityNotifications, cancelAllNotifications, requestPermissions,
} from '../../src/utils/notifications';
import { exportBackup, pickAndParseBackup, backupSummary, FlowDayBackup } from '../../src/utils/backup';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const ACCENT_OPTS = ['#7c6aff','#ff6a8e','#4ade80','#fbbf24','#60a5fa','#f97316'];

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.secLabel}>{label}</Text>
      <View style={s.secCard}>{children}</View>
    </View>
  );
}

function Row({ icon, iconBg, label, sub, right, onPress, danger = false, disabled = false }:
  { icon:string; iconBg:string; label:string; sub?:string; right?:React.ReactNode;
    onPress?:()=>void; danger?:boolean; disabled?:boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
      style={[s.row, danger && s.rowDanger, disabled && { opacity: 0.4 }]} disabled={disabled}
    >
      <View style={[s.rowIcon,{backgroundColor:iconBg}]}><Text style={{fontSize:16}}>{icon}</Text></View>
      <View style={s.rowBody}>
        <Text style={[s.rowLabel,danger&&s.rowLabelDanger]}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      <View style={s.rowRight}>{right}</View>
    </TouchableOpacity>
  );
}

function RowToggle({ icon, iconBg, label, sub, value, onValueChange, disabled }:
  { icon:string; iconBg:string; label:string; sub?:string;
    value:boolean; onValueChange:(v:boolean)=>void; disabled?:boolean }) {
  return (
    <View style={[s.row, disabled && { opacity: 0.4 }]}>
      <View style={[s.rowIcon,{backgroundColor:iconBg}]}><Text style={{fontSize:16}}>{icon}</Text></View>
      <View style={s.rowBody}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={disabled ? undefined : onValueChange}
        trackColor={{ false:'#26262f', true:'#7c6aff' }} thumbColor="#ffffff"
        ios_backgroundColor="#26262f" disabled={disabled}
      />
    </View>
  );
}

function Chip({ label, color }: { label:string; color?:string }) {
  return (
    <View style={s.chip}>
      <Text style={[s.chipText, color ? { color } : null]}>{label}</Text>
    </View>
  );
}

function AccentPicker({ selected, onSelect, accent }:
  { selected:string; onSelect:(c:string)=>void; accent:string }) {
  return (
    <View style={s.accentRow}>
      {ACCENT_OPTS.map((c) => (
        <TouchableOpacity key={c} onPress={() => onSelect(c)}
          style={[s.accentDot,{backgroundColor:c}, selected===c&&s.accentDotSelected]}
          activeOpacity={0.8}
        >
          {selected===c && <Text style={s.accentCheck}>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const {
    settings, templates, habits, habitLogs, tasks, objectives, journal,
    updateSettings, importData, resetStore,
  } = useStore();

  const { accent } = useTheme();

  const [notifHabits,   setNotifHabits]   = useState(settings.notificationsEnabled);
  const [notifActivity, setNotifActivity] = useState(settings.notifyActivities ?? true);
  const [notifSummary,  setNotifSummary]  = useState(settings.notifySummary    ?? true);
  const [exporting,     setExporting]     = useState(false);
  const [importing,     setImporting]     = useState(false);

  const handleUpdate = useCallback((patch: Partial<AppSettings>) => updateSettings(patch), [updateSettings]);

  // ── Notification handlers ────────────────────────────────────────────────
  const handleNotifHabits = useCallback(async (v: boolean) => {
    setNotifHabits(v); handleUpdate({ notificationsEnabled: v });
    if (!await requestPermissions()) return;
    if (!v) { await cancelAllNotifications(); return; }
    await scheduleHabitReminder(true);
    await scheduleDailySummary(notifSummary);
    await scheduleActivityNotifications(templates, notifActivity);
  }, [notifSummary, notifActivity, templates]);

  const handleNotifActivity = useCallback(async (v: boolean) => {
    setNotifActivity(v); handleUpdate({ notifyActivities: v });
    if (!await requestPermissions()) return;
    await scheduleActivityNotifications(templates, v);
  }, [templates]);

  const handleNotifSummary = useCallback(async (v: boolean) => {
    setNotifSummary(v); handleUpdate({ notifySummary: v });
    if (!await requestPermissions()) return;
    await scheduleDailySummary(v);
  }, []);

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const backup: FlowDayBackup = {
        app:'FlowDay', version:'1.0', exportedAt:new Date().toISOString(),
        data:{ templates, habits, habitLogs, tasks, objectives, journal, settings },
      };
      await exportBackup(backup);
    } catch (e: any) {
      Alert.alert('Error al exportar', e?.message ?? 'Intenta de nuevo.');
    } finally { setExporting(false); }
  }, [templates, habits, habitLogs, tasks, objectives, journal, settings]);

  // ── Import ───────────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      const result = await pickAndParseBackup();
      if (!result.ok) {
        if (result.error !== 'Cancelado') Alert.alert('Error al importar', result.error);
        return;
      }
      const summary = backupSummary(result.backup);
      Alert.alert('Importar respaldo', `¿Reemplazar todos tus datos?\n\n${summary}`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Importar', style: 'destructive',
          onPress: () => { importData(result.backup.data); Alert.alert('✅ Datos importados', 'Restaurado correctamente.'); },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error al importar', e?.message ?? 'Archivo inválido.');
    } finally { setImporting(false); }
  }, [importData]);

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    Alert.alert('⚠️ Borrar todos los datos',
      'Se eliminarán hábitos, plantillas, tareas y diario. Esta acción no se puede deshacer.',
      [{ text:'Cancelar', style:'cancel' },
       { text:'Borrar todo', style:'destructive',
         onPress: async () => { await cancelAllNotifications(); resetStore(); } }]
    );
  }, [resetStore]);

  // ── Re-run onboarding ───────────────────────────────────────────────────
  const handleReOnboard = useCallback(() => {
    Alert.alert('Ver presentación', '¿Volver a ver el tutorial de bienvenida?', [
      { text:'Cancelar', style:'cancel' },
      { text:'Ver tutorial', onPress: () => handleUpdate({ hasOnboarded: false }) },
    ]);
  }, [handleUpdate]);

  const stats = { habits:habits.length, templates:templates.length, logs:habitLogs.length, tasks:tasks.length };
  const userName = settings.userName || 'Usuario';

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Ajustes</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Profile ── */}
        <View style={s.profileCard}>
          <View style={[s.avatar, { backgroundColor: accent }]}>
            <Text style={s.avatarText}>{(userName[0] ?? 'U').toUpperCase()}</Text>
          </View>
          <View style={s.profileBody}>
            <Text style={s.profileName}>{userName}</Text>
            <Text style={s.profileSub}>INFORMÁTICA · UNAM FES C4</Text>
          </View>
          <TouchableOpacity
            onPress={handleReOnboard}
            style={[s.editBtn, { borderColor: accent + '44', backgroundColor: accent + '10' }]}
            activeOpacity={0.7}
          >
            <Text style={[s.editBtnText, { color: accent }]}>Tutorial</Text>
          </TouchableOpacity>
        </View>

        {/* ── Data Summary ── */}
        <View style={s.dataBar}>
          {[
            { label:'HÁBITOS',    value: stats.habits    },
            { label:'PLANTILLAS', value: stats.templates },
            { label:'REGISTROS',  value: stats.logs      },
            { label:'TAREAS',     value: stats.tasks     },
          ].map(({ label, value }) => (
            <View key={label} style={s.dataStat}>
              <Text style={[s.dataVal, { color: accent }]}>{value}</Text>
              <Text style={s.dataLbl}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Notificaciones ── */}
        <Section label="NOTIFICACIONES">
          <RowToggle icon="🔔" iconBg="rgba(124,106,255,.12)"
            label="Recordatorios de hábitos" sub="Notificación diaria a las 9:00 AM"
            value={notifHabits} onValueChange={handleNotifHabits}
          />
          <View style={s.divider}/>
          <RowToggle icon="⏰" iconBg="rgba(251,191,36,.1)"
            label="Alertas de actividad" sub="Según el tiempo configurado por actividad"
            value={notifActivity} onValueChange={handleNotifActivity} disabled={!notifHabits}
          />
          <View style={s.divider}/>
          <RowToggle icon="🎯" iconBg="rgba(74,222,128,.08)"
            label="Resumen diario" sub="Cada noche a las 10:00 PM"
            value={notifSummary} onValueChange={handleNotifSummary} disabled={!notifHabits}
          />
        </Section>

        {/* ── Apariencia ── */}
        <Section label="APARIENCIA">
          <Row icon="🎨" iconBg={accent+'18'} label="Color de acento"
            right={<AccentPicker selected={settings.accentColor} onSelect={(c)=>handleUpdate({accentColor:c})} accent={accent}/>}
          />
          <View style={s.divider}/>
          <Row icon="🌙" iconBg="rgba(255,255,255,.04)" label="Tema" sub="Siempre oscuro"
            right={<Chip label="Dark"/>}
          />
          <View style={s.divider}/>
          <Row icon="🎯" iconBg="rgba(255,255,255,.04)" label="Meta de racha"
            right={<Chip label={`${settings.streakGoal}d`} color={accent}/>}
          />
        </Section>

        {/* ── Datos ── */}
        <Section label="DATOS Y RESPALDO">
          <Row icon={exporting?'⏳':'📤'} iconBg="rgba(96,165,250,.1)"
            label="Exportar datos" sub="JSON · hábitos, plantillas, tareas, diario"
            right={exporting ? <ActivityIndicator size="small" color="#60a5fa"/> : <Text style={s.arrow}>›</Text>}
            onPress={exporting?undefined:handleExport} disabled={exporting}
          />
          <View style={s.divider}/>
          <Row icon={importing?'⏳':'📥'} iconBg="rgba(74,222,128,.08)"
            label="Importar respaldo" sub="Restaurar desde un archivo .json de FlowDay"
            right={importing ? <ActivityIndicator size="small" color="#4ade80"/> : <Text style={s.arrow}>›</Text>}
            onPress={importing?undefined:handleImport} disabled={importing}
          />
        </Section>

        {/* ── Acerca de ── */}
        <Section label="ACERCA DE">
          <Row icon="⚡" iconBg={accent+'18'} label="Versión" right={<Chip label="v0.1.0" color={accent}/>}/>
          <View style={s.divider}/>
          <Row icon="🐙" iconBg="rgba(255,255,255,.04)" label="GitHub" sub="iamhuitron/flowday" right={<Text style={s.arrow}>›</Text>}/>
          <View style={s.divider}/>
          <Row icon="🎓" iconBg="rgba(255,255,255,.04)" label="Desarrollado por" sub="Miguel · UNAM FES Cuautitlán"/>
        </Section>

        {/* ── Zona de peligro ── */}
        <Section label="ZONA DE PELIGRO">
          <Row icon="🗑️" iconBg="rgba(248,113,113,.1)" label="Borrar todos los datos"
            sub="Restablece la app al estado inicial"
            right={<Text style={[s.arrow,{color:'#f87171'}]}>›</Text>}
            onPress={handleReset} danger
          />
        </Section>

        <View style={s.footer}>
          <Text style={s.footerText}>FlowDay v0.1.0 · MIT License</Text>
          <Text style={[s.footerLink,{color:accent+'88'}]}>github.com/iamhuitron/flowday</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:         {flex:1,backgroundColor:'#0c0c0f'},
  header:            {paddingHorizontal:20,paddingTop:16,paddingBottom:14,borderBottomWidth:1,borderBottomColor:'#26262f'},
  headerTitle:       {fontSize:18,fontWeight:'600',color:'#eeeef5',letterSpacing:-0.3},
  scroll:            {flex:1},
  scrollContent:     {padding:16,paddingBottom:100},
  profileCard:       {backgroundColor:'#141418',borderWidth:1,borderColor:'#26262f',borderRadius:16,padding:16,flexDirection:'row',alignItems:'center',gap:14,marginBottom:12},
  avatar:            {width:52,height:52,borderRadius:16,alignItems:'center',justifyContent:'center',flexShrink:0},
  avatarText:        {fontSize:22,fontWeight:'700',color:'#fff'},
  profileBody:       {flex:1},
  profileName:       {fontSize:16,fontWeight:'600',color:'#eeeef5',marginBottom:3},
  profileSub:        {fontFamily:MONO,fontSize:9,color:'#55556a'},
  editBtn:           {padding:6,paddingHorizontal:14,borderRadius:8,borderWidth:1,flexShrink:0},
  editBtnText:       {fontSize:12,fontWeight:'500'},
  dataBar:           {flexDirection:'row',backgroundColor:'#141418',borderWidth:1,borderColor:'#26262f',borderRadius:14,marginBottom:20,overflow:'hidden'},
  dataStat:          {flex:1,alignItems:'center',paddingVertical:12,borderRightWidth:1,borderRightColor:'#26262f'},
  dataVal:           {fontFamily:MONO,fontSize:16,fontWeight:'700'},
  dataLbl:           {fontFamily:MONO,fontSize:8,color:'#55556a',marginTop:3},
  section:           {marginBottom:20},
  secLabel:          {fontFamily:MONO,fontSize:9,color:'#55556a',letterSpacing:0.12,marginBottom:8,marginLeft:4},
  secCard:           {backgroundColor:'#141418',borderWidth:1,borderColor:'#26262f',borderRadius:14,overflow:'hidden'},
  divider:           {height:1,backgroundColor:'#1c1c22',marginLeft:60},
  row:               {flexDirection:'row',alignItems:'center',gap:12,padding:14},
  rowDanger:         {},
  rowIcon:           {width:32,height:32,borderRadius:9,alignItems:'center',justifyContent:'center',flexShrink:0},
  rowBody:           {flex:1,minWidth:0},
  rowLabel:          {fontSize:13,fontWeight:'500',color:'#eeeef5'},
  rowLabelDanger:    {color:'#f87171'},
  rowSub:            {fontSize:11,color:'#55556a',marginTop:2},
  rowRight:          {flexShrink:0,alignItems:'flex-end'},
  arrow:             {fontSize:18,color:'#55556a'},
  chip:              {backgroundColor:'#1c1c22',borderWidth:1,borderColor:'#26262f',borderRadius:6,paddingHorizontal:10,paddingVertical:3},
  chipText:          {fontFamily:MONO,fontSize:10,color:'#55556a'},
  accentRow:         {flexDirection:'row',gap:6},
  accentDot:         {width:22,height:22,borderRadius:11,borderWidth:2,borderColor:'transparent',alignItems:'center',justifyContent:'center'},
  accentDotSelected: {borderColor:'#fff',transform:[{scale:1.15}]},
  accentCheck:       {color:'#fff',fontSize:10,fontWeight:'700'},
  footer:            {alignItems:'center',paddingVertical:16},
  footerText:        {fontFamily:MONO,fontSize:10,color:'#26262f',marginBottom:4},
  footerLink:        {fontFamily:MONO,fontSize:10},
});
