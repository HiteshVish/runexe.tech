/**
 * Parse multipart FormData to object matching PHP $_POST structure.
 * Handles nested objects (seller[name], items[0][qty]) and file uploads.
 */

export interface ParsedFormData {
  [key: string]: any;
}

export interface ParsedFiles {
  [key: string]: {
    data: ArrayBuffer;
    size: number;
    type: string;
    name: string;
  };
}

/**
 * Parse FormData into nested object structure.
 * Converts:
 *   seller[name] -> { seller: { name: value } }
 *   items[0][qty] -> { items: [{ qty: value }] }
 */
export function parseFormData(formData: FormData): {
  post: ParsedFormData;
  files: ParsedFiles;
} {
  const post: ParsedFormData = {};
  const files: ParsedFiles = {};

  for (const [key, value] of formData.entries()) {
    // Handle files
    if (value instanceof File) {
      // Skip if no file selected
      if (value.size === 0 && value.name === '') {
        continue;
      }
      // Files will be handled separately in Next.js
      // For now, we'll store a reference
      files[key] = {
        data: new ArrayBuffer(0), // Will be filled by caller
        size: value.size,
        type: value.type,
        name: value.name,
      };
      continue;
    }

    // Parse nested keys like seller[name] or items[0][qty]
    const match = key.match(/^([^\[]+)(?:\[([^\]]*)\])+$/);
    
    if (!match) {
      // Simple key
      post[key] = value;
      continue;
    }

    // Extract all bracket parts
    const parts: string[] = [match[1]];
    let remaining = key.slice(match[1].length);
    
    while (remaining) {
      const bracketMatch = remaining.match(/^\[([^\]]*)\]/);
      if (!bracketMatch) break;
      parts.push(bracketMatch[1]);
      remaining = remaining.slice(bracketMatch[0].length);
    }

    // Build nested structure
    let current = post;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      
      if (!(part in current)) {
        // Determine if next level should be array or object
        current[part] = /^\d+$/.test(nextPart) ? [] : {};
      }
      
      current = current[part];
      
      // Handle array indices
      if (Array.isArray(current) && /^\d+$/.test(nextPart)) {
        const index = parseInt(nextPart, 10);
        const isLastPart = i === parts.length - 2;
        
        if (!current[index]) {
          current[index] = isLastPart ? {} : (
            i + 2 < parts.length && /^\d+$/.test(parts[i + 2]) ? [] : {}
          );
        }
      }
    }

    // Set final value
    const lastPart = parts[parts.length - 1];
    
    if (Array.isArray(current) && /^\d+$/.test(lastPart)) {
      const index = parseInt(lastPart, 10);
      current[index] = value;
    } else {
      (current as ParsedFormData)[lastPart] = value;
    }
  }

  return { post, files };
}

/**
 * Convert a Next.js Request with FormData to invoice build format.
 * Handles file uploads by reading them into memory.
 */
export async function parseInvoiceFormData(request: Request): Promise<{
  post: ParsedFormData;
  files: ParsedFiles;
}> {
  const formData = await request.formData();
  const { post, files } = parseFormData(formData);

  // Read file contents
  for (const [key, fileInfo] of Object.entries(files)) {
    const file = formData.get(key);
    if (file instanceof File) {
      const buffer = await file.arrayBuffer();
      files[key].data = buffer;
    }
  }

  return { post, files };
}

/**
 * Helper to convert File objects in FormData for invoice building.
 * Returns files in the format expected by buildInvoice().
 */
export async function prepareInvoiceFiles(formData: FormData): Promise<ParsedFiles> {
  const files: ParsedFiles = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File && value.size > 0) {
      const buffer = await value.arrayBuffer();
      files[key] = {
        data: buffer,
        size: value.size,
        type: value.type,
        name: value.name,
      };
    }
  }

  return files;
}
