// Full pixel dimensions are independent of JPEG quality.
export function pdfImageEncoding(edge,quality=99){return {type:'image/jpeg',quality:Math.max(.35,Math.min(1,Number(quality)/100))};}
export function encodePdfImage(canvas,edge,quality=99){const options=pdfImageEncoding(edge,quality);return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PDF image encoding failed.')),options.type,options.quality));}
