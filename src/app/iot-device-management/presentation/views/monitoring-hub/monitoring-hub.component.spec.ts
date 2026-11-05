/**
 * Monitoring hub — i18n + load smoke.
 */
import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MonitoringHubComponent } from './monitoring-hub.component';
import { EdgeGatewayService } from '../../../infrastructure/edge-gateway-api.service';
import { SensorReadingService } from '../../../../shared/infrastructure/sensor-reading.service';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({ template: '' })
class DummyComponent {}

const ES: Record<string, string> = {
  'monitor.heading': 'Monitoreo técnico',
  'monitor.subtitle': 'Gateways, lecturas, umbrales agronómicos y salud de sector.',
  'monitor.gateways': 'Edge gateways',
  'monitor.devices': 'Dispositivos IoT del gateway',
  'monitor.thresholds': 'Umbrales agronómicos',
  'monitor.readings': 'Lecturas recientes',
  'monitor.loading': 'Cargando monitoreo...',
  'monitor.saveThreshold': 'Guardar umbral',
  'monitor.saving': 'Guardando...',
  'monitor.emptyGateways': 'Sin gateways registrados.',
  'monitor.emptyDevices': 'Sin dispositivos en este gateway.',
  'monitor.emptyThresholds': 'Sin umbrales.',
  'monitor.emptyReadings': 'Sin lecturas recientes.',
  'monitor.emptyHealth': 'Sin datos de salud.',
  'monitor.contextLine': 'GW {{gateway}} · IoT {{device}} · Sector #{{sector}}',
  'monitor.sectorHealth': 'Salud del sector',
  'monitor.refresh': 'Actualizar',
  'monitor.backDashboard': 'Dashboard',
  'monitor.thresholdSaved': 'Umbral guardado.',
  'monitor.editThresholdHint': 'Selecciona un umbral.',
  'monitor.exceeded': 'Fuera de rango',
  'monitor.inRange': 'En rango',
  'monitor.error.load': 'No se pudo cargar.',
  'monitor.error.save': 'No se pudo guardar.',
  'monitor.error.invalidRange': 'Rango inválido.',
  'monitor.form.type': 'Tipo de sensor',
  'monitor.form.min': 'Mínimo',
  'monitor.form.max': 'Máximo',
  'monitor.form.description': 'Descripción',
  'monitor.table.type': 'Tipo',
  'monitor.table.value': 'Valor',
  'monitor.table.device': 'IoT MAC',
  'monitor.table.when': 'Fecha',
  'monitor.connectivity.connected': 'Conectado',
  'monitor.connectivity.disconnected': 'Desconectado',
  'monitor.sensorType.Temperature': 'Temperatura',
  'monitor.sensorType.Humidity': 'Humedad',
  'monitor.sensorType.PH': 'pH',
  'monitor.sensorType.Luminosity': 'Luminosidad',
  'monitor.sensorType.SoilMoisture': 'Humedad del suelo',
  'monitor.health.healthy': 'Óptimo',
  'monitor.health.warning': 'Atención',
  'monitor.health.critical': 'Crítico',
  'monitor.health.unknown': 'Sin datos',
};

const EN: Record<string, string> = {
  'monitor.heading': 'Technical monitoring',
  'monitor.subtitle': 'Gateways, readings, agronomic thresholds and sector health.',
  'monitor.gateways': 'Edge gateways',
  'monitor.devices': 'Gateway IoT devices',
  'monitor.thresholds': 'Agronomic thresholds',
  'monitor.readings': 'Recent readings',
  'monitor.loading': 'Loading monitoring...',
  'monitor.saveThreshold': 'Save threshold',
  'monitor.saving': 'Saving...',
  'monitor.emptyGateways': 'No gateways registered.',
  'monitor.emptyDevices': 'No devices on this gateway.',
  'monitor.emptyThresholds': 'No thresholds.',
  'monitor.emptyReadings': 'No recent readings.',
  'monitor.emptyHealth': 'No health data.',
  'monitor.contextLine': 'GW {{gateway}} · IoT {{device}} · Sector #{{sector}}',
  'monitor.sectorHealth': 'Sector health',
  'monitor.refresh': 'Refresh',
  'monitor.backDashboard': 'Dashboard',
  'monitor.thresholdSaved': 'Threshold saved.',
  'monitor.editThresholdHint': 'Select a threshold.',
  'monitor.exceeded': 'Out of range',
  'monitor.inRange': 'In range',
  'monitor.error.load': 'Could not load.',
  'monitor.error.save': 'Could not save.',
  'monitor.error.invalidRange': 'Invalid range.',
  'monitor.form.type': 'Sensor type',
  'monitor.form.min': 'Min',
  'monitor.form.max': 'Max',
  'monitor.form.description': 'Description',
  'monitor.table.type': 'Type',
  'monitor.table.value': 'Value',
  'monitor.table.device': 'IoT MAC',
  'monitor.table.when': 'When',
  'monitor.connectivity.connected': 'Connected',
  'monitor.connectivity.disconnected': 'Disconnected',
  'monitor.sensorType.Temperature': 'Temperature',
  'monitor.sensorType.Humidity': 'Humidity',
  'monitor.sensorType.PH': 'pH',
  'monitor.sensorType.Luminosity': 'Luminosity',
  'monitor.sensorType.SoilMoisture': 'Soil moisture',
  'monitor.health.healthy': 'Healthy',
  'monitor.health.warning': 'Warning',
  'monitor.health.critical': 'Critical',
  'monitor.health.unknown': 'No data',
};

function setup(locale: 'es' | 'en') {
  const map = locale === 'en' ? EN : ES;
  return TestBed.configureTestingModule({
    imports: [MonitoringHubComponent],
    providers: [
      {
        provide: EdgeGatewayService,
        useValue: {
          listGateways: vi.fn(() =>
            of([{ mac: 'AA:BB:CC:00:00:01', isConnected: false, status: 'Disconnected' }]),
          ),
          getDevices: vi.fn(() =>
            of({
              gatewayMac: 'AA:BB:CC:00:00:01',
              devices: [{ deviceMac: 'AA:BB:CC:DD:EE:01' }],
            }),
          ),
          listThresholds: vi.fn(() =>
            of([
              {
                edgeMac: 'AA:BB:CC:00:00:01',
                iotMac: 'AA:BB:CC:DD:EE:01',
                min: 15,
                max: 35,
                description: 'Temp',
                type: 'Temperature',
              },
            ]),
          ),
          updateThreshold: vi.fn(() => of(void 0)),
          getSectorHealth: vi.fn(() =>
            of({
              sectorId: 1,
              status: 1,
              sensorDetails: [
                {
                  sensorType: 'Temperature',
                  value: 40,
                  minThreshold: 15,
                  maxThreshold: 35,
                  isExceeded: true,
                },
              ],
            }),
          ),
        },
      },
      {
        provide: SensorReadingService,
        useValue: {
          list: vi.fn(() =>
            of({
              readings: [
                {
                  id: 1,
                  deviceId: 0,
                  plantationId: 1,
                  monitoringZoneId: 0,
                  userId: 3,
                  variableType: 'temperature',
                  label: 'Temperature',
                  sensorType: 'Temperature',
                  value: 40,
                  unit: '°C',
                  deviceSerial: 'AA:BB:CC:DD:EE:01',
                  recordedAt: '2026-07-10T14:00:00Z',
                },
              ],
              totalElements: 1,
              totalPages: 1,
              page: 1,
              size: 1,
            }),
          ),
        },
      },
      { provide: TranslationService, useValue: { translate: (k: string) => map[k] ?? k } },
      provideRouter([{ path: 'dashboard', component: DummyComponent }]),
    ],
  });
}

describe('MonitoringHubComponent — i18n (Spanish)', () => {
  it('shows Spanish headings and health', async () => {
    await setup('es').compileComponents();
    const fixture = TestBed.createComponent(MonitoringHubComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toMatch(/Monitoreo t[eé]cnico/i);
    expect(text).toMatch(/Salud del sector/i);
    expect(text).toMatch(/Atenci[oó]n|Fuera de rango/i);
    expect(text).toMatch(/Umbrales/i);
    expect(text).toMatch(/Lecturas recientes/i);
    expect(text).toMatch(/Desconectado/i);
    expect(text).toMatch(/Temperatura/i);
  });
});

describe('MonitoringHubComponent — i18n (English)', () => {
  it('shows English headings', async () => {
    await setup('en').compileComponents();
    const fixture = TestBed.createComponent(MonitoringHubComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Technical monitoring');
    expect(text).toContain('Sector health');
    expect(text).toContain('Out of range');
    expect(text).toContain('Disconnected');
    expect(text).toContain('Save threshold');
  });
});
