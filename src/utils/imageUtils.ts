export function cleanImageUrl(url?: string, defaultFallback = '/images/hall_alpha.jpeg'): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return defaultFallback;
  }

  const lower = url.toLowerCase().trim();

  // 1. Data URLs
  if (lower.startsWith('data:image/')) {
    return url;
  }

  // 2. HTTP/HTTPS URLs (including Firebase Storage URLs)
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return url;
  }

  // 3. Local uploaded files (/uploads/...)
  if (lower.startsWith('/uploads/')) {
    return url;
  }

  // 4. Exact static asset matches or legacy uncompressed names
  if (lower === '/images/hall_alpha.jpeg' || lower === '/images/hall_alpha.jpg' || lower.endsWith('hall alpha.png') || lower.endsWith('hall%20alpha.png')) {
    return '/images/hall_alpha.jpeg';
  }
  if (lower === '/images/hall_b_panoramic.jpeg' || lower === '/images/hall_b_panoramic.jpg' || lower.endsWith('hall b panoramic.png') || lower.endsWith('hall%20b%20panoramic.png')) {
    return '/images/hall_b_panoramic.jpeg';
  }
  if (lower === '/images/hall_b_view_one.jpeg' || lower === '/images/hall_b_view_one.jpg' || lower.includes('hall_b_view_one')) {
    return '/images/hall_b_view_one.jpeg';
  }
  if (lower === '/images/hall_b_view_two.jpeg' || lower === '/images/hall_b_view_two.jpg' || lower.includes('hall_b_view_two')) {
    return '/images/hall_b_view_two.jpeg';
  }
  if (lower === '/images/surau.jpeg' || lower === '/images/surau.jpg' || lower === 'surau.jpg' || lower === '/surau.jpg') {
    return '/images/surau.jpeg';
  }
  if (lower.includes('imadina')) {
    return '/imadina-logo.jpg';
  }

  if (url.startsWith('/src/assets/images/')) {
    return url.replace('/src/assets/images/', '/images/');
  }

  return url;
}

export function compressImageFile(file: File, maxWidth = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
