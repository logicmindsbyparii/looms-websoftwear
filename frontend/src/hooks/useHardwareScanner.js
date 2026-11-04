import { useEffect, useRef } from 'react';

/**
 * Global hardware barcode/QR scanner listener (USB or Bluetooth scanner guns acting as HID keyboard).
 * Hardware scanners send character bursts (<50ms per key) followed by Enter.
 *
 * @param {Function} onScan - Callback function receiving the scanned text.
 * @param {Object} options
 * @param {boolean} options.enabled - Whether scanner listening is active (default true)
 * @param {number} options.maxInterval - Max ms between keys to count as hardware scan (default 60ms)
 * @param {number} options.minChars - Minimum characters for a valid code (default 3)
 */
export function useHardwareScanner(onScan, options = {}) {
  const { enabled = true, maxInterval = 60, minChars = 3 } = options;
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Ignore modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If time since last key is too long, reset the buffer
      if (timeDiff > maxInterval && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const scannedText = bufferRef.current.trim();
        bufferRef.current = '';

        if (scannedText.length >= minChars) {
          // If the focus was on a standard input, blur it or prevent default to stop spurious form submissions
          if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            // If the input was not specifically intended for typing this exact code
            e.preventDefault();
          }

          if (onScanRef.current) {
            onScanRef.current(scannedText);
          }
        }
        return;
      }

      // Append printable single character
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, maxInterval, minChars]);
}

