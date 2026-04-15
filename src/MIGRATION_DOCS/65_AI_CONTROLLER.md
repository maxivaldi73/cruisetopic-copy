# AI Controller

**Purpose:** Manage AI-powered content generation for ports, cruiselines, and ships.  
**Namespace:** `App\Http\Controllers\Admin\Ai`  
**Location:** `App/Http/Controllers/Admin/Ai/AiController.php`  
**Type:** AI integration — medium priority

---

## 📋 Overview

| Aspect | Detail |
|--------|--------|
| File Size | 7.7 KB |
| Methods | 4 (generateContent, getPortDescription, getCruiselineDescription, getShipDescription) |
| Auth | Likely admin-only |
| Purpose | Generate/edit descriptions and SEO metadata via LLM |
| Related Models | Port, Cruiseline, Ship |
| Related Services | AiService |
| Related Enums | TextGenerationModel |
| External APIs | OpenAI GPT (via AiService) |

---

## 🔧 Controller Methods

### generateContent(AIGenerationRequest $request): JsonResponse
Generic AI content generator (flexible endpoint).

```php
public function generateContent(AIGenerationRequest $request): JsonResponse
{
    $model = $request->input('model');
    $modelId = $request->input('modelId');
    $lang = $request->input('lang');
    
    // Call service with model enum
    $generatedResponse = $this->aiService->generateContentsByModel(
        TextGenerationModel::from($model),
        $modelId,
        $lang
    );
    
    Log::info("AI generated response in {$lang}: ", $generatedResponse);
    
    // Check for 'result' key
    if (!isset($generatedResponse['result'])) {
        return response()->json($generatedResponse, 500);
    }
    
    return response()->json($generatedResponse['result']);
}
```

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| 1 | ⚠️ MEDIUM | **Error handling** — Returns 500 if 'result' key missing, but response already has error info | Confusing |
| 2 | ⚠️ MEDIUM | **No authorization check** — Anyone can call generateContent | Security |
| 3 | ⚠️ MEDIUM | **TextGenerationModel::from()** — Will throw exception if invalid model | Unhandled |
| 4 | ℹ️ LOW | **Italian comment** — "Simulazione logica di generazione con AI" | i18n |

---

### getPortDescription()
Auto-generate port descriptions and SEO metadata.

```php
public function getPortDescription()
{
    $metas = 'genera anche un meta title, 3 meta keywords, e una meta description '
        . 'compresa tra i 140 e i 150 caratteri. rispondi in italiano e in formato JSON, '
        . 'adatto ad essere decodificato in PHP, con le proprieta: description,'
        . 'meta_description, meta_title e meta_keywords';
    
    $ports = Port::query()->take(1)->get();
    
    try {
        foreach ($ports as $port) {
            $editedByAi = false;
            $createdByAi = false;
            
            if ($port->description) {
                // Edit existing description
                $prompt = 'Data la seguente descrizione ' . $port->description 
                    . ' rielabora la descrizione in modo che sia compresa tra le 200 e 250 parole.' 
                    . $metas;
                $editedByAi = true;
            } elseif ($port->name && $port->lat && $port->lng) {
                // Create new description from coordinates
                // ⚠️ BUG: $ports->lat should be $port->lat
                $prompt = 'Scrivi una descrizione compresa tra le 200 e 250 parole del porto '
                    . 'con nome ' . $port->name . 'con latitudine ' . $ports->lat // BUG HERE
                    . ' e con longitudine ' . $port->lng . '. ' . $metas;
                $createdByAi = true;
            } else {
                return;
            }
            
            // Call AI API
            $response = $this->aiService->callGPTApi($prompt);
            $response = json_decode($response);
            
            // ⚠️ BUG: If json_decode fails, $response is null → accessing properties crashes
            $port->description = $response->description;
            $port->description_edited_by_ai = $editedByAi;
            $port->description_created_by_ai = $createdByAi;
            $port->meta_description = $response->meta_description;
            $port->meta_title = $response->meta_title;
            $port->meta_keywords = $response->meta_keywords;
            $port->save();
        }
    } catch (\Exception $e) {
        Log::channel('ai')->error($e->getMessage());
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **Bug: $ports->lat instead of $port->lat** (line 53) | Wrong coordinates in prompt |
| 2 | 🔴 CRITICAL | **No JSON validation** — json_decode() may return null if invalid JSON | Null pointer exception |
| 3 | ⚠️ HIGH | **No authorization check** — anyone can regenerate all port descriptions | Security risk |
| 4 | ⚠️ HIGH | **Hardcoded take(1)** — only processes 1 port, then returns silently | Incomplete feature |
| 5 | ⚠️ MEDIUM | **Silent failures** — catch block logs error but doesn't notify user | No feedback |
| 6 | ⚠️ MEDIUM | **No response** — Method doesn't return anything (void) | No user feedback |
| 7 | ⚠️ MEDIUM | **API call per port** — loops through ports, making sequential API calls | Performance/cost |
| 8 | ⚠️ MEDIUM | **Italian hardcoded prompts** — not configurable per language | i18n issue |
| 9 | ℹ️ LOW | **take(1) with foreach** — Unnecessary loop for 1 item | Code smell |

---

### getCruiselineDescription()
Auto-generate cruiseline descriptions with detailed content.

```php
public function getCruiselineDescription()
{
    try {
        $metas = 'genera un meta title, 3 meta keywords, e una meta description '
            . 'compresa tra i 140 e i 150 caratteri. rispondi in italiano e in formato JSON...';
        
        $cruiselines = Cruiseline::all();
        
        foreach ($cruiselines as $cruiseline) {
            $editedByAi = false;
            $createdByAi = false;
            
            // Complex condition checking description length > 5
            if (
                ($cruiseline->description && strlen($cruiseline->description) > 5) 
                || ($cruiseline->getPropTranslation('description', 'IT') 
                    && strlen($cruiseline->getPropTranslation('description', 'IT')) > 5)
            ) {
                // Edit existing
                $description = ($cruiseline->description && strlen($cruiseline->description) > 5)
                    ? $cruiseline->description
                    : $cruiseline->getPropTranslation('description', 'IT');
                $prompt = 'Dato il seguente testo descrittivo: ' . $description 
                    . ' rielabora la descrizione in modo da produrre un testo unico '
                    . 'di almeno 250 parole...'; // (50 more chars of prompt)
                $editedByAi = true;
            } elseif ($cruiseline->name && strlen($cruiselines->name) > 6) {
                // ⚠️ BUG: $cruiselines->name should be $cruiseline->name
                $prompt = 'Scrivi una descrizione della compagnia di crociere con nome '
                    . $cruiseline->name . '...';
                $createdByAi = true;
            } else {
                continue;
            }
            
            // First prompt: generate description
            $response = $this->aiService->callGPTApi($prompt);
            $cruiseline->description = $response; // ⚠️ Assumes string, not validated
            $cruiseline->storeTranslations(['description_IT' => $response]);
            $cruiseline->description_edited_by_ai = $editedByAi;
            $cruiseline->description_created_by_ai = $createdByAi;
            
            // Second prompt: generate SEO metadata from description
            $prompt = 'Data la descrizione ' . $response . ' ' . $metas;
            $response = $this->aiService->callGPTApi($prompt);
            $response = json_decode($response); // ⚠️ May return null
            
            if ($response) {
                $cruiseline->meta_description = $response->meta_description;
                $cruiseline->meta_title = $response->meta_title;
                $cruiseline->meta_keywords = $response->meta_keywords;
            }
            
            $cruiseline->save();
        }
    } catch (\Exception $e) {
        Log::channel('ai')->error($e->getMessage());
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **Bug: $cruiselines->name instead of $cruiseline->name** (line 85) | Wrong check, crashes or always false |
| 2 | ⚠️ HIGH | **No JSON validation** — json_decode may return null | Null pointer if no 'if' check |
| 3 | ⚠️ HIGH | **Assumes json_decode succeeds** — line 92 assigns string without validation | Crash risk |
| 4 | ⚠️ HIGH | **No authorization check** — anyone can regenerate all cruiseline descriptions | Security |
| 5 | ⚠️ HIGH | **2 API calls per cruiseline** — generates description, then generates metadata | High cost |
| 6 | ⚠️ MEDIUM | **No response** — Method doesn't return anything (void) | No feedback |
| 7 | ⚠️ MEDIUM | **Silent failures** — catch block logs but doesn't notify user | No visibility |
| 8 | ⚠️ MEDIUM | **storeTranslations()** — Hardcoded 'IT' language | Not flexible |
| 9 | ℹ️ LOW | **Nested conditions** — Complex boolean logic (lines 81-82) | Hard to read |

---

### getShipDescription()
Auto-generate ship descriptions.

```php
public function getShipDescription()
{
    $metas = 'genera anche un meta title, 3 meta keywords, e una meta description '
        . 'compresa tra i 140 e i 150 caratteri. rispondi in formato json secondo '
        . 'lo schema {"description":"","meta_description":"","meta_title":"","meta_keywords":""}';
    
    $ships = Ship::all();
    
    try {
        foreach ($ships as $ship) {
            $editedByAi = false;
            $createdByAi = false;
            
            if ($ship->description) {
                // Edit existing
                $prompt = 'Data la seguente descrizione ' . $ship->description 
                    . ' rielabora la descrizione in modo che sia compresa tra le 200 e 250 parole.'
                    . $metas;
                $editedByAi = true;
            } elseif ($ship->name) {
                // Create new
                $prompt = 'Scrivi una descrizione compresa tra le 200 e 250 parole della nave '
                    . 'da crociera con nome ' . $ship->name . ' della compagnia '
                    . $ship->cruiseline->name . '. ' . $metas; // ⚠️ N+1: loads cruiseline per ship
                $createdByAi = true;
            } else {
                return; // ⚠️ Returns early if no description/name
            }
            
            // Call API
            $response = $this->aiService->callGPTApi($prompt);
            // ⚠️ Inconsistent: expects array, not JSON-decoded object
            $ship->description = $response['description'];
            $ship->description_edited_by_ai = $editedByAi;
            $ship->description_created_by_ai = $createdByAi;
            $ship->meta_description = $response['meta_description'];
            $ship->meta_title = $response['meta_title'];
            $ship->meta_keywords = $response['meta_keywords'];
            $ship->save();
        }
    } catch (\Exception $e) {
        Log::channel('ai')->error($e->getMessage());
    }
}
```

**Issues:**

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | **Type inconsistency** — Expects array but JSON likely returns object | Crash on $response['description'] |
| 2 | ⚠️ HIGH | **N+1 query** — $ship->cruiseline->name loads cruiseline for each ship | Performance |
| 3 | ⚠️ HIGH | **No authorization check** — anyone can regenerate all ship descriptions | Security |
| 4 | ⚠️ HIGH | **Early return in loop** — returns if ONE ship has no description | Incomplete |
| 5 | ⚠️ MEDIUM | **No JSON validation** — Assumes callGPTApi returns valid data | Crash risk |
| 6 | ⚠️ MEDIUM | **No response** — Method returns void | No feedback |
| 7 | ⚠️ MEDIUM | **Silent failures** — catch logs but doesn't notify | No visibility |
| 8 | ℹ️ LOW | **Inconsistent return type** — Should return or continue | Code smell |

---

## ⚠️ Critical Issues Summary

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 CRITICAL | 4 | $ports->lat bug, $cruiselines->name bug, JSON validation missing, type inconsistency |
| ⚠️ HIGH | 14 | No authorization (3×), N+1 query, 2 API calls per entity, hardcoded take(1), early return |
| ⚠️ MEDIUM | 12 | Silent failures, no response/feedback, no JSON checks, hardcoded languages |
| ℹ️ LOW | 5 | Italian comments, code smell, inconsistent logic |

---

## 📝 Migration Notes for Base44

### Strategy: Backend Functions + Job Queue + Audit Trail

**Step 1: Create AI Generation Entity**

```json
// entities/AiGeneration.json
{
  "entity_type": {"type": "string", "enum": ["port", "cruiseline", "ship"]},
  "entity_id": {"type": "string"},
  "description": {"type": "string"},
  "meta_title": {"type": "string"},
  "meta_description": {"type": "string"},
  "meta_keywords": {"type": "array"},
  "created_by_ai": {"type": "boolean", "default": true},
  "edited_by_ai": {"type": "boolean", "default": false},
  "model_used": {"type": "string"},
  "prompt": {"type": "string"},
  "status": {"type": "string", "enum": ["pending", "completed", "failed"]},
  "error_message": {"type": "string"}
}
```

**Step 2: Backend Functions**

**Function: generateDescription**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { entity_type, entity_id, prompt } = await req.json();

  if (!entity_type || !entity_id || !prompt) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Call LLM via Base44 integration
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          meta_title: { type: 'string' },
          meta_description: { type: 'string' },
          meta_keywords: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    // Create audit record
    const generation = await base44.entities.AiGeneration.create({
      entity_type,
      entity_id,
      description: result.description,
      meta_title: result.meta_title,
      meta_description: result.meta_description,
      meta_keywords: result.meta_keywords,
      model_used: 'gpt-4o-mini',
      prompt,
      status: 'completed',
    });

    return Response.json({ generation, result });
  } catch (error) {
    // Log error
    const generation = await base44.entities.AiGeneration.create({
      entity_type,
      entity_id,
      prompt,
      status: 'failed',
      error_message: error.message,
    });

    return Response.json({ error: error.message, generation }, { status: 500 });
  }
});
```

**Function: generatePortDescriptions**

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { port_ids } = await req.json();

  if (!Array.isArray(port_ids) || port_ids.length === 0) {
    return Response.json({ error: 'port_ids array required' }, { status: 400 });
  }

  // Dispatch jobs for each port
  const jobs = [];
  for (const port_id of port_ids) {
    // Could use automation to dispatch background jobs
    // For now, return job IDs
    jobs.push({ port_id, status: 'queued' });
  }

  return Response.json({ jobs, message: 'Port descriptions queued for generation' });
});
```

**Step 3: React Component**

```tsx
// pages/admin/AiGeneratorPage.jsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AiGeneratorPage() {
  const [entityType, setEntityType] = useState('port');
  const [entityId, setEntityId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('generateDescription', {
        entity_type: entityType,
        entity_id: entityId,
        prompt,
      }),
    onSuccess: (data) => {
      setResult(data.data.result);
      setLoading(false);
    },
    onError: (error) => {
      alert('Error: ' + error.message);
      setLoading(false);
    },
  });

  const handleGenerate = () => {
    if (!entityId || !prompt) {
      alert('Fill in all fields');
      return;
    }
    setLoading(true);
    mutation.mutate();
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">AI Content Generator</h1>

      <Card>
        <CardHeader>
          <CardTitle>Generate Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="port">Port</SelectItem>
              <SelectItem value="cruiseline">Cruiseline</SelectItem>
              <SelectItem value="ship">Ship</SelectItem>
            </SelectContent>
          </Select>

          <input
            type="text"
            placeholder="Entity ID"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <Textarea
            placeholder="Enter prompt for AI generation..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-32"
          />

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Description:</strong>
              <p className="text-sm text-gray-600">{result.description}</p>
            </div>
            <div>
              <strong>Meta Title:</strong>
              <p className="text-sm text-gray-600">{result.meta_title}</p>
            </div>
            <div>
              <strong>Meta Description:</strong>
              <p className="text-sm text-gray-600">{result.meta_description}</p>
            </div>
            <div>
              <strong>Meta Keywords:</strong>
              <p className="text-sm text-gray-600">{result.meta_keywords?.join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Key Improvements

1. **Fix All Bugs** — $ports->lat, $cruiselines->name, type inconsistency
2. **Authorization** — Admin-only enforced
3. **JSON Validation** — Proper error handling
4. **Audit Trail** — Track all AI generations with prompts/models
5. **No N+1 Queries** — Batch processing with job queue
6. **Better Feedback** — User sees generation status
7. **Config-driven Prompts** — Move hardcoded prompts to database
8. **Error Logging** — Persistent error records
9. **Cost Tracking** — Log model used, prompt length
10. **User Control** — Manual generation with result preview

---

## Summary

AiController (7.7KB) generates descriptions/SEO metadata for ports, cruiselines, ships via LLM. **CRITICAL BUGS:** $ports->lat instead of $port->lat (line 53), $cruiselines->name instead of $cruiseline->name (line 85), no JSON validation (crashes on null), type inconsistency (expects array vs object). Issues: no authorization (3 methods), N+1 query, 2 API calls per entity, hardcoded take(1), early return in loop, silent failures, no user feedback, Italian hardcoded prompts, inconsistent return types.

In Base44: Create AiGeneration audit entity, backend functions with authorization/validation/error handling, use Base44 LLM integration, batch processing with job queue, React generator page with result preview, fix all bugs, configurable prompts.

**Migration Priority: MEDIUM** — active AI integration, multiple critical bugs, security gaps, but relatively straightforward refactoring.