export async function checkGuildAccess(guildId, session) {
    if (!session || !session.user) return { allowed: false, reason: 'NO_SESSION' };

    try {
        const res = await fetch(`/api/guilds/${guildId}/permissions`, {
            cache: 'no-store'
        });

        if (res.status === 404) {
            const errData = await res.json().catch(() => ({}));
            // Check if it's "Guild not found" (Bot not in guild)
            if (errData.code === 'GUILD_NOT_FOUND' || errData.error === 'Guild not found') {
                return { allowed: false, reason: 'NOT_JOINED' };
            }
            return { allowed: false, reason: 'NOT_FOUND' };
        }

        if (res.status === 403 || res.status === 401) {
            return { allowed: false, reason: 'UNAUTHORIZED' };
        }

        if (res.ok) {
            const data = await res.json();
            const allowed = data.can_manage_guild || data.is_owner || data.is_extra_owner || data.is_admin;
            return { allowed, reason: allowed ? null : 'INSUFFICIENT_PERMISSIONS' };
        }

        return { allowed: false, reason: `API_ERROR_${res.status}` };

    } catch (e) {
        console.error("Access Check Logic Error:", e);
        return { allowed: false, reason: 'ERROR' };
    }
}

