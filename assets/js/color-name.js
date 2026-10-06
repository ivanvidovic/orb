// Descriptive labels, not calibrated textile or paint names.
export function colorName(hex){
 const [r,g,b]=hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255);
 const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
 if(d<.045){return l>.97?'White':l>.87?'Off-White':l>.68?'Light Gray':l>.39?'Gray':l>.15?'Charcoal':'Black';}
 const sat=d/(1-Math.abs(2*l-1));
 let h=d===0?0:60*(max===r?((g-b)/d+6)%6:max===g?(b-r)/d+2:(r-g)/d+4);
 let name=h<15||h>=345?'Red':h<42?'Orange':h<68?'Yellow':h<95?'Olive':h<160?'Green':h<195?'Teal':h<255?'Blue':h<290?'Purple':'Pink';
 if(h>=15&&h<50&&l<.48)name='Brown';
 if(h>=25&&h<65&&l>=.48&&sat<.5)name='Beige';
 if(h>=200&&h<260&&l<.28)return 'Navy';
 if((h>=330||h<15)&&l<.32)return 'Burgundy';
 if(l>.78)return 'Pale '+name;
 if(l<.24)return 'Dark '+name;
 if(sat<.32)return 'Muted '+name;
 if(l>.64)return 'Light '+name;
 return name;
}
