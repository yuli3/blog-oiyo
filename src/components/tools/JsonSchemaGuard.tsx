import React, { useState, useMemo } from 'react';

const DEFAULT_SCHEMA = `{
  "type": "object",
  "required": ["name", "version", "autonomyTier"],
  "properties": {
    "name": { "type": "string", "minLength": 2 },
    "version": { "type": "string" },
    "autonomyTier": { "type": "number", "minimum": 1, "maximum": 5 }
  }
}`;

const DEFAULT_DATA = `{
  "name": "agent-git-guard",
  "version": "1.0.0",
  "autonomyTier": 1
}`;

interface ValidationError {
  path: string;
  message: string;
}

export default function JsonSchemaGuard() {
  const [schemaText, setSchemaText] = useState(DEFAULT_SCHEMA);
  const [dataText, setDataText] = useState(DEFAULT_DATA);

  const validationResult = useMemo(() => {
    const startTime = performance.now();
    let schema: any;
    let data: any;
    const errors: ValidationError[] = [];

    try {
      schema = JSON.parse(schemaText);
    } catch {
      return {
        isValid: false,
        errors: [{ path: 'root', message: 'Invalid Schema JSON syntax' }],
        durationMs: 0
      };
    }

    try {
      data = JSON.parse(dataText);
    } catch {
      return {
        isValid: false,
        errors: [{ path: 'root', message: 'Invalid Data JSON syntax' }],
        durationMs: 0
      };
    }

    // Basic assertion engine
    if (schema.type === 'object') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push({ path: 'root', message: 'Expected JSON Object' });
      } else {
        // Required check
        if (Array.isArray(schema.required)) {
          for (const req of schema.required) {
            if (!(req in data) || data[req] === undefined || data[req] === null) {
              errors.push({ path: req, message: `Missing required property '${req}'` });
            }
          }
        }

        // Properties check
        if (schema.properties && typeof schema.properties === 'object') {
          for (const [key, propRule] of Object.entries(schema.properties as Record<string, any>)) {
            if (key in data) {
              const val = data[key];
              if (propRule.type === 'string') {
                if (typeof val !== 'string') {
                  errors.push({ path: key, message: `Expected string, received ${typeof val}` });
                } else if (propRule.minLength !== undefined && val.length < propRule.minLength) {
                  errors.push({ path: key, message: `String length must be at least ${propRule.minLength}` });
                }
              } else if (propRule.type === 'number') {
                if (typeof val !== 'number') {
                  errors.push({ path: key, message: `Expected number, received ${typeof val}` });
                } else {
                  if (propRule.minimum !== undefined && val < propRule.minimum) {
                    errors.push({ path: key, message: `Value must be >= ${propRule.minimum}` });
                  }
                  if (propRule.maximum !== undefined && val > propRule.maximum) {
                    errors.push({ path: key, message: `Value must be <= ${propRule.maximum}` });
                  }
                }
              }
            }
          }
        }
      }
    }

    const durationMs = Math.round((performance.now() - startTime) * 1000) / 1000;
    return {
      isValid: errors.length === 0,
      errors,
      durationMs
    };
  }, [schemaText, dataText]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Agent JSON Schema Guard</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Zero-dependency sub-millisecond JSON schema validator and assertion engine.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {validationResult.isValid ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
                ✓ VALID ({validationResult.durationMs}ms)
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
                ✕ INVALID ({validationResult.errors.length} errors)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              JSON Schema Definition
            </label>
            <textarea
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              rows={10}
              className="w-full font-mono text-xs bg-muted/40 border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Paste JSON Schema..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Payload to Validate
            </label>
            <textarea
              value={dataText}
              onChange={(e) => setDataText(e.target.value)}
              rows={10}
              className="w-full font-mono text-xs bg-muted/40 border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Paste JSON Data..."
            />
          </div>
        </div>

        {/* Validation Errors Box */}
        {validationResult.errors.length > 0 && (
          <div className="border border-destructive/30 bg-destructive/10 rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider">
              Validation Failures:
            </h4>
            <ul className="text-xs text-destructive space-y-1 font-mono">
              {validationResult.errors.map((err, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="font-bold">• [{err.path}]:</span>
                  <span>{err.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
