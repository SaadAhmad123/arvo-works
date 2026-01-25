import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter as HTTPExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPTraceExporter as ProtoBufExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { SEMRESATTRS_PROJECT_NAME } from '@arizeai/openinference-semantic-conventions';
import { load } from '@std/dotenv';
await load({ export: true });

const jaegerExporter = new HTTPExporter({
  url: Deno.env.get('OTEL_JAEGER_EXPORTER_URL') || 'http://localhost:6001/jaeger/v1/traces',
});

const phoenixExporter = new ProtoBufExporter({
  url: Deno.env.get('OTEL_PHOENIX_EXPORTER_URL') || 'http://localhost:6001/arize/v1/traces',
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'kanban-agent',
    [SEMRESATTRS_PROJECT_NAME]: 'kanban-agent',
  }),
  spanProcessors: [
    new BatchSpanProcessor(jaegerExporter),
    new SimpleSpanProcessor(phoenixExporter),
  ],
});

sdk.start();

console.log('OpenTelemetry initialized');

Deno.addSignalListener('SIGINT', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error shutting down tracing', error))
    .finally(() => Deno.exit(0));
});

export { sdk };
