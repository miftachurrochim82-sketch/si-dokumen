// ============================================================
// SIDOKUMEN - 00_Utils.gs (v1.0.2 — audit fire-and-forget + dry-run)
// ============================================================
// Wrapper audit ke SI-PLATFORM. Domain-spesifik ekosistem Trenggalek.
// CoreLib hanya menulis AUDIT_LOGS lokal; konsolidasi lintas-app via HTTP.
//
// AUDIT_DRY_RUN = 'true' → skip HTTP (untuk self-check & unit test).
// ============================================================

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

function audit_(actor, action, type, id, ok, msg) {
  sendAuditLog_(actor, action, type, id, ok ? 'SUCCESS' : 'FAILED', msg || '');
}

// ============================================================
// SELF-CHECK
// ============================================================
function testUtilsSelfCheck() {
  Logger.log('=== 00_Utils.gs v1.0.2 self-check ===');
  Logger.log((typeof audit_        === 'function' ? '✅' : '❌') + ' audit_ tersedia');
  Logger.log((typeof sendAuditLog_ === 'function' ? '✅' : '❌') + ' sendAuditLog_ tersedia');
  var hasUrl = (typeof PLATFORM_API_URL !== 'undefined' && PLATFORM_API_URL) ? '✅' : '❌';
  Logger.log(hasUrl + ' PLATFORM_API_URL tersedia');
  try {
    audit_({ email: 'test@example.com' }, 'SELF_CHECK', 'SYSTEM', 'ALL', true, 'Ping dari self-check');
    Logger.log('✅ audit_() tidak melempar error');
  } catch (e) {
    Logger.log('❌ audit_() melempar error: ' + e.message);
  }
  Logger.log('=== Selesai ===');
}
