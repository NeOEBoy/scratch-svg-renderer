/**
 * @fileOverview Import bitmap data into Scratch 3.0, resizing image as necessary.
 */
/* eslint-disable global-require */

const base64js = require('base64-js');

let fontLoadStatus = 'unloaded';
const FONTS = {
  'Sans Serif': 'NotoSans-Medium.ttf',
  'Serif': 'SourceSerifPro-Regular.otf',
  'Handwriting': 'handlee-regular.ttf',
  'Marker': 'knewave.ttf',
  'Curly': 'Griffy-Regular.ttf',
  'Pixel': 'Grand9K-Pixel.ttf',
  'Scratch': 'Scratch.ttf'
};

// const loadFontSync = () => {
//   // Synchronously load TTF fonts.
//   // First, have Webpack load their data as Base 64 strings.
//   /* eslint-disable global-require */
//   if (fontLoadStatus === 'loaded') return
//   fontLoadStatus = 'loaded'

//   for (const fontName in FONTS) {
//     FONTS[fontName] = require(`base64-loader!./ttf/${FONTS[fontName]}`)
//   }
//   // For each Base 64 string,
//   // 1. Replace each with a usable @font-face tag that points to a Data URI.
//   // 2. Inject the font into a style on `document.body`, so measurements
//   //    can be accurately taken in SvgRenderer._transformMeasurements.
//   for (const fontName in FONTS) {
//     const fontData = FONTS[fontName];
//     FONTS[fontName] = '@font-face {' +
//       `font-family: "${fontName}";src: url("data:application/x-font-ttf;charset=utf-8;base64,${fontData}");}`;
//   }

//   if (!document.getElementById('scratch-font-styles')) {
//     const documentStyleTag = document.createElement('style');
//     documentStyleTag.id = 'scratch-font-styles';
//     for (const fontName in FONTS) {
//       documentStyleTag.textContent += FONTS[fontName];
//     }
//     document.body.insertBefore(documentStyleTag, document.body.firstChild);
//   }
//   /* eslint-enable global-require */
// }

const loadFontAsync = () => {
  // console.log('loadFontAsync start')
  if (fontLoadStatus === 'loaded') {
    // console.log('loadFontAsync loaded')
    return Promise.resolve();
  } else if (fontLoadStatus === 'loading') {
    // 如果当前正在加载资源，开启循环检测是否加载完成
    // console.log('loadFontAsync loading')
    const waitP = () => {
      return new Promise((resolve) => {
        let loadedChecker = setInterval(() => {
          // console.log('loadFontAsync interval')
          if (fontLoadStatus === 'loading') {
            // console.log('loadFontAsync again')
          } else {
            clearInterval(loadedChecker);
            loadedChecker = null;
            // console.log('loadFontAsync resolve')
            resolve();
          }
        }, 100)
      })
    }

    return waitP();
  }
  fontLoadStatus = 'loading';

  const loadFontAsyn = (fontName) => {
    const readPromise = new Promise((resolve, reject) => {
      let oReq = new XMLHttpRequest();
      oReq.open("GET", `/static/svg-fonts/${FONTS[fontName]}`, true);
      oReq.responseType = "arraybuffer";
      oReq.onload = function () {
        if (oReq.status !== 200) {
          reject();
          return;
        }

        var arrayBuffer = oReq.response; // Note: not oReq.responseText
        if (arrayBuffer) {
          // console.log('arrayBuffer = ' + arrayBuffer);
          // let data = Buffer.from(arrayBuffer);
          // let data = iconv.encode(arrayBuffer, 'binary');
          // console.log('data = ' + data);
          FONTS[fontName] = base64js.fromByteArray(new Uint8Array(arrayBuffer));
          resolve();
        }
      };
      oReq.onerror = function () {
        reject();
      };
      oReq.send(null);
    });

    return readPromise;
  };

  /* eslint-enable global-require */
  const loadFontPromises = [];
  for (const fontName in FONTS) {
    loadFontPromises.push(loadFontAsyn(fontName));
  }
  return Promise.all(loadFontPromises).then(() => {
    // For each Base 64 string,
    // 1. Replace each with a usable @font-face tag that points to a Data URI.
    // 2. Inject the font into a style on `document.body`, so measurements
    //    can be accurately taken in SvgRenderer._transformMeasurements.
    for (const fontName in FONTS) {
      const fontData = FONTS[fontName];
      FONTS[fontName] = '@font-face {' +
        `font-family: "${fontName}";src: url("data:application/x-font-ttf;charset=utf-8;base64,${fontData}");}`;
    }

    if (!document.getElementById('scratch-font-styles')) {
      const documentStyleTag = document.createElement('style');
      documentStyleTag.id = 'scratch-font-styles';
      for (const fontName in FONTS) {
        documentStyleTag.textContent += FONTS[fontName];
      }
      document.body.insertBefore(documentStyleTag, document.body.firstChild);
    }
    fontLoadStatus = 'loaded';
    // console.log('loadFontAsync complete')
  });
}

/**
 * Given SVG data, inline the fonts. This allows them to be rendered correctly when set
 * as the source of an HTMLImageElement. Here is a note from tmickel:
 *   // Inject fonts that are needed.
 *   // It would be nice if there were another way to get the SVG-in-canvas
 *   // to render the correct font family, but I couldn't find any other way.
 *   // Other things I tried:
 *   // Just injecting the font-family into the document: no effect.
 *   // External stylesheet linked to by SVG: no effect.
 *   // Using a <link> or <style>@import</style> to link to font-family
 *   // injected into the document: no effect.
 * @param {string} svgString The string representation of the svg to modify
 * @return {string} The svg with any needed fonts inlined
 */
// const inlineSvgFonts = function (svgString) {
//   // console.log('inlineSvgFonts begin svgString = ' + svgString)
//   loadFontSync();

//   // Collect fonts that need injection.
//   const fontsNeeded = new Set();
//   const fontRegex = /font-family="([^"]*)"/g;
//   let matches = fontRegex.exec(svgString);
//   while (matches) {
//     fontsNeeded.add(matches[1]);
//     matches = fontRegex.exec(svgString);
//   }
//   if (fontsNeeded.size > 0) {
//     let str = '<defs><style>';
//     for (const font of fontsNeeded) {
//       if (FONTS.hasOwnProperty(font)) {
//         str += `${FONTS[font]}`;
//         // console.log(`${FONTS[font]}`)
//       }
//     }
//     str += '</style></defs>';
//     svgString = svgString.replace(/<svg[^>]*>/, `$&${str}`);
//     // console.log('inlineSvgFonts end svgString = ' + svgString)
//     return svgString;
//   }
//   return svgString;
// };

const inlineSvgFontsAsync = (svgString) => {
  // Make it clear that this function only operates on strings.
  // If we don't explicitly throw this here, the function silently fails.
  if (typeof svgString !== 'string') {
    throw new Error('SVG to be inlined is not a string');
  }

  // Collect fonts that need injection.
  const fontsNeeded = new Set();
  const fontRegex = /font-family="([^"]*)"/g;
  let matches = fontRegex.exec(svgString);
  while (matches) {
    fontsNeeded.add(matches[1]);
    matches = fontRegex.exec(svgString);
  }
  if (fontsNeeded.size > 0) {
    return loadFontAsync().then(() => {
      let str = '<defs><style>';
      for (const font of fontsNeeded) {
        if (FONTS.hasOwnProperty(font)) {
          str += `${FONTS[font]}`;
        }
      }
      str += '</style></defs>';
      svgString = svgString.replace(/<svg[^>]*>/, `$&${str}`);
      return Promise.resolve(svgString);
    });
  }
  return Promise.resolve(svgString);
}

module.exports = inlineSvgFontsAsync
