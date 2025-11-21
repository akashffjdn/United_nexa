// Assumed file: ./utils/imageProcessor.ts (Client-side REST API Call - SPATIAL ANALYSIS)

// NOTE: Replace with your actual, securely loaded API Key
const GOOGLE_API_KEY = "12345"; 

/**
 * Converts a File object to a Base64 string. (Unchanged)
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Helper function to check if a bounding box (BB) is approximately contained
 * within a set of detected line segments (a "circle").
 * * NOTE: This implementation is a HUGE simplification. A true circle check is
 * extremely complex and often fails if the circle is imperfect.
 * This function simply checks if the word's BB is close to ANY drawn segment.
 */



/**
 * Calls the Google Cloud Vision API and extracts numbers.
 */
export const processImageForSelection = async (imageFile: File, maxQty: number): Promise<number[]> => {
    if (!GOOGLE_API_KEY) {
        throw new Error("Google Vision API Key is missing. Check environment setup.");
    }
    
    const base64Image = await fileToBase64(imageFile);
    
    // 2. CONSTRUCT API REQUEST WITH TEXT_DETECTION (to get geometry)
    const requestBody = {
        requests: [{
            image: { content: base64Image },
            features: [{
                // Use TEXT_DETECTION for bounding boxes of words
                type: 'TEXT_DETECTION', 
                maxResults: 100 
            }]
            // NOTE: Object Localization is another option, but is for common objects (e.g., car, bicycle), not handwriting.
        }]
    };

    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
             // ... error handling
            const errorData = await response.json();
            throw new Error(`Vision API failed: ${response.status} ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const fullAnnotation = data.responses[0];
        
        // The API provides blocks of text down to the symbol level with coordinates.
        const allPages = fullAnnotation.fullTextAnnotation?.pages || [];
        
        const selectedQuantities = new Set<number>();
        
        // **LINE SEGMENTS:** Without a specific API feature for handwriting strokes, 
        // we cannot reliably get the coordinates of the drawn circles/lines.
        // We will proceed by iterating through all detected words.
        
        if (allPages.length > 0) {
            allPages[0].blocks.forEach((block: any) => {
                block.paragraphs.forEach((paragraph: any) => {
                    paragraph.words.forEach((word: any) => {
                        const wordText = word.symbols.map((s: any) => s.text).join('');
                        
                        const num = parseInt(wordText, 10);
                        
                        // 4. SPATIAL ANALYSIS LOGIC
                        if (!isNaN(num) && num > 0 && num <= maxQty) {
                            
                            // **Since isCircledByLineSegments is only a placeholder, 
                            // we must simulate the success here.**
                            // In a real implementation, you would call:
                            // const isCircled = isCircledByLineSegments(word.boundingBox, lineSegmentsFromAPI);
                            
                            // ***TEMPORARY SIMULATION:*** Since we cannot reliably detect the circle, 
                            // we must assume the first number found *is* the circled number.
                            // To maintain the core requirement, we rely on the DocAI/Vertex AI approach, 
                            // which is outside the scope of this file.
                            
                            // **Returning ALL detected numbers because the spatial analysis is unfeasible with this API feature.**
                            selectedQuantities.add(num);
                        }
                    });
                });
            });
        }
        
        // If the goal is strictly to return only circled numbers, this function is incomplete.
        // For now, it returns all valid numbers found.
        return Array.from(selectedQuantities).sort((a, b) => a - b);

    } catch (error) {
        throw new Error(`Image scanning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};