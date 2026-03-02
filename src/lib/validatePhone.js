/**
 * Valida y normaliza número de teléfono (México: 10 dígitos).
 * Acepta: 5512345678, 55 1234 5678, +52 55 1234 5678, 525512345678
 * @param {string} value - Lo que ingresó el usuario
 * @returns {{ valid: boolean, normalized?: string, message?: string }}
 */
export function validatePhone(value) {
  const digits = (value || '').replace(/\D/g, '')
  if (digits.length === 0) {
    return { valid: false, message: 'Ingresa un número de teléfono.' }
  }
  let ten = digits
  if (digits.length === 12 && digits.startsWith('52')) {
    ten = digits.slice(2)
  } else if (digits.length === 11 && digits.startsWith('1')) {
    ten = digits.slice(1)
  }
  if (ten.length !== 10) {
    return { valid: false, message: 'El número debe tener 10 dígitos (ej. 55 1234 5678).' }
  }
  if (!/^[1-9]/.test(ten)) {
    return { valid: false, message: 'Número no válido.' }
  }
  return { valid: true, normalized: ten }
}
