// ============================================================
// SIDOKUMEN - 00_Utils.gs (v1.0.3 — audit fire-and-forget + dry-run + jsonSafe_)
// ============================================================
// Wrapper audit ke SI-PLATFORM. Domain-spesifik ekosistem Trenggalek.
// CoreLib hanya menulis AUDIT_LOGS lokal; konsolidasi lintas-app via HTTP.
//
// Fungsi:
//   - sendAuditLog_(actor, action, type, id, result, details)  — HTTP POST
//   - audit_(actor, action, type, id, ok, msg)                 — wrapper boolean
//   - jsonSafe_(v)                                             — escape JSON untuk <script>
//   - testUtilsSelfCheck()                                     — verifikasi cepat
//
// AUDIT_DRY_RUN = 'true' → skip HTTP (untuk self-check & unit test).
//   Set: PropertiesService.getScriptProperties().setProperty('AUDIT_DRY_RUN','true')
//   Hapus: PropertiesService.getScriptProperties().deleteProperty('AUDIT_DRY_RUN')
// ============================================================

/**
 * Kirim audit log ke SI-PLATFORM (HTTP POST, fire-and-forget).
 * Kegagalan HTTP TIDAK menggagalkan operasi utama.
 * @param {Object}  actor
 * @param {string}  action
 * @param {string}  resourceType
 * @param {string}  resourceId
 * @param {string}  result         — 'SUCCESS' | 'FAILED'
 * @param {string}  details
 */
function sendAuditLog_(actor, action, resourceType, resourceId, result, details) {
  try {
    // Dry-run guard: cegah spam audit produksi saat self-check/test
    try {
      var dry = PropertiesService.getScriptProperties().getProperty('AUDIT_DRY_RUN');
      if (dry === 'true') { Logger.log('[AUDIT DRY-RUN] ' + action + ' ' + resourceId); return; }
    } catch (e) { /* property service gagal → lanjut normal */ }

    var actorId = (actor && (actor.email || actor.id || actor.username)) || 'anonymous';
    if (!PLATFORM_API_URL) return;

    UrlFetchApp.fetch(PLATFORM_API_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        action: 'record_audit',
        data: {
          actor_id:       actorId,
          application_id: APP_CODE,
          action:         action,
          resource_type:  resourceType,
          resource_id:    resourceId,
          result:         result || 'SUCCESS',
          details:        details || ''
        }
      }),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log('[AUDIT LOG WARN] ' + e.message);
  }
}

/**
 * Wrapper audit — signature boolean kompatibel call-site lama.
 * @param {Object}  actor
 * @param {string}  action
 * @param {string}  type
 * @param {string}  id
 * @param {boolean} ok
 * @param {string}  msg
 */
function audit_(actor, action, type, id, ok, msg) {
  sendAuditLog_(actor, action, type, id, ok ? 'SUCCESS' : 'FAILED', msg || '');
}

/**
 * Escape JSON untuk disisipkan aman ke dalam <script> di HTML.
 * Mencegah XSS / HTML parse error kalau nilai mengandung `</script>`, `<`, `>`, `&`.
 *
 * Penggunaan di Index.html:
 *   window.__SSO_TICKET__ = <?!= jsonSafe_(String(ticket || '')) ?>;
 *
 * @param {*} v — nilai apapun yang akan di-JSON.stringify
 * @returns {string} JSON string dengan escape HTML-safe
 */
function jsonSafe_(v) {
  return JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// ============================================================
// SELF-CHECK
// ============================================================
/**
 * Verifikasi cepat — panggil dari editor GAS.
 * Otomatis set AUDIT_DRY_RUN sementara agar tidak spam audit produksi.
 */
function testUtilsSelfCheck() {
  Logger.log('=== 00_Utils.gs v1.0.3 self-check ===');

  // 1. Fungsi tersedia
  Logger.log((typeof audit_           === 'function' ? '✅' : '❌') + ' audit_ tersedia');
  Logger.log((typeof sendAuditLog_    === 'function' ? '✅' : '❌') + ' sendAuditLog_ tersedia');
  Logger.log((typeof jsonSafe_        === 'function' ? '✅' : '❌') + ' jsonSafe_ tersedia');

  // 2. PLATFORM_API_URL tersedia (dari 01_ConfigAndBridge)
  var hasUrl = (typeof PLATFORM_API_URL !== 'undefined' && PLATFORM_API_URL) ? '✅' : '❌';
  Logger.log(hasUrl + ' PLATFORM_API_URL tersedia (' +
             ((typeof PLATFORM_API_URL !== 'undefined' && PLATFORM_API_URL)
               ? String(PLATFORM_API_URL).slice(0, 60) + '…'
               : '(kosong)') + ')');

  // 3. Uji jsonSafe_ (escape HTML chars)
  var testVal = '</script><img src=x onerror=alert(1)>';
  var safe = jsonSafe_(testVal);
  var isSafe = safe.indexOf('</script>') === -1 && safe.indexOf('<') === -1;
  Logger.log((isSafe ? '✅' : '❌') + ' jsonSafe_ escape HTML (' + safe.slice(0, 50) + '…)');

  // 4. Fire-and-forget test dengan dry-run sementara
  var prevDry = null;
  try { prevDry = PropertiesService.getScriptProperties().getProperty('AUDIT_DRY_RUN'); } catch (e) {}
  try { PropertiesService.getScriptProperties().setProperty('AUDIT_DRY_RUN', 'true'); } catch (e) {}

  try {
    audit_({ email: 'test@example.com' }, 'SELF_CHECK', 'SYSTEM', 'ALL', true, 'Ping dari self-check');
    Logger.log('✅ audit_() tidak melempar error (dry-run)');
  } catch (e) {
    Logger.log('❌ audit_() melempar error: ' + e.message);
  } finally {
    // Restore AUDIT_DRY_RUN ke kondisi sebelumnya
    try {
      if (prevDry === null) {
        PropertiesService.getScriptProperties().deleteProperty('AUDIT_DRY_RUN');
      } else {
        PropertiesService.getScriptProperties().setProperty('AUDIT_DRY_RUN', prevDry);
      }
    } catch (e) {}
  }

  Logger.log('=== Selesai ===');
}
