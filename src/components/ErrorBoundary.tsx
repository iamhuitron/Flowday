/**
 * FlowDay — Error Boundary
 * Captura errores en tiempo de render y muestra una pantalla de recuperación
 * en vez de un crash silencioso o pantalla en blanco.
 *
 * Uso en _layout.tsx:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

interface Props  { children: ReactNode }
interface State  { hasError: boolean; error: Error | null; info: ErrorInfo | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, info: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    // En producción, aquí podrías enviar a Sentry, Crashlytics, etc.
    console.error('[FlowDay] Error no manejado:', error);
    console.error('[FlowDay] Component stack:', info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, info } = this.state;
    const isDev = __DEV__;

    return (
      <SafeAreaView style={s.container}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Icon */}
          <View style={s.iconWrap}>
            <Text style={s.icon}>⚡</Text>
          </View>

          {/* Title */}
          <Text style={s.title}>Algo salió mal</Text>
          <Text style={s.subtitle}>
            FlowDay encontró un error inesperado. Tus datos están seguros — pulsa el botón para continuar.
          </Text>

          {/* Actions */}
          <TouchableOpacity onPress={this.handleReset} style={s.primaryBtn} activeOpacity={0.8}>
            <Text style={s.primaryBtnTxt}>Reintentar →</Text>
          </TouchableOpacity>

          {/* Dev details */}
          {isDev && error && (
            <View style={s.devBox}>
              <Text style={s.devLabel}>ERROR (solo visible en desarrollo)</Text>
              <Text style={s.devMessage}>{error.message}</Text>
              {info?.componentStack && (
                <Text style={s.devStack} numberOfLines={12}>
                  {info.componentStack.trim()}
                </Text>
              )}
            </View>
          )}

          <Text style={s.footer}>FlowDay v0.1.0 · iamhuitron</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#0c0c0f' },
  content:      { flexGrow:1, alignItems:'center', justifyContent:'center', padding:32 },
  iconWrap:     { width:80, height:80, borderRadius:22, backgroundColor:'rgba(248,113,113,.1)', borderWidth:1.5, borderColor:'rgba(248,113,113,.3)', alignItems:'center', justifyContent:'center', marginBottom:20 },
  icon:         { fontSize:38 },
  title:        { fontSize:24, fontWeight:'700', color:'#eeeef5', letterSpacing:-0.5, marginBottom:10, textAlign:'center' },
  subtitle:     { fontSize:14, color:'#6b6b7e', textAlign:'center', lineHeight:22, marginBottom:28 },
  primaryBtn:   { backgroundColor:'#7c6aff', paddingHorizontal:28, paddingVertical:14, borderRadius:14, marginBottom:12 },
  primaryBtnTxt:{ fontSize:15, fontWeight:'700', color:'#fff' },
  devBox:       { marginTop:24, width:'100%', backgroundColor:'#141418', borderWidth:1, borderColor:'#26262f', borderRadius:12, padding:14 },
  devLabel:     { fontFamily:MONO, fontSize:9, color:'#f87171', letterSpacing:0.1, marginBottom:8 },
  devMessage:   { fontFamily:MONO, fontSize:12, color:'#fbbf24', marginBottom:8 },
  devStack:     { fontFamily:MONO, fontSize:10, color:'#55556a', lineHeight:16 },
  footer:       { fontFamily:MONO, fontSize:9, color:'#26262f', marginTop:32 },
});
