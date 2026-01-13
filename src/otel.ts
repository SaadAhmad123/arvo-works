import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { SEMRESATTRS_PROJECT_NAME } from '@arizeai/openinference-semantic-conventions';

const jaegerExporter = new OTLPTraceExporter({
  url: 'http://localhost:6001/jaeger/v1/traces',
});

const phoenixExporter = new OTLPTraceExporter({
  url: 'http://localhost:6001/arize/v1/traces',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'kanban-agent',
    [SEMRESATTRS_PROJECT_NAME]: 'kanban-agent',
  }),
  spanProcessors: [
    new BatchSpanProcessor(jaegerExporter),
    new BatchSpanProcessor(phoenixExporter),
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
