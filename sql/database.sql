-- ============================================================================
-- BASE DE DATOS COMPLETA - TRACCAR INTEGRATION
-- ============================================================================
-- Este archivo contiene el esquema completo de la base de datos para la
-- integración con Traccar API. Puede ser ejecutado directamente en Supabase.
--
-- Este es el archivo único y definitivo que contiene toda la estructura de
-- la base de datos: tablas, funciones, triggers, políticas RLS e índices.
-- ============================================================================

-- ============================================================================
-- 1. TABLA DE PERFILES
-- ============================================================================
-- Extiende la tabla auth.users de Supabase con información adicional del usuario
-- y mapeo con Traccar

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Perfiles de usuario que extienden auth.users con información adicional';
COMMENT ON COLUMN profiles.user_id IS 'Referencia al usuario en auth.users de Supabase';
COMMENT ON COLUMN profiles.is_active IS 'Indica si el perfil está activo';

-- ============================================================================
-- 2. TABLA DE ROLES
-- ============================================================================
-- Define los roles disponibles en el sistema (admin, usuario, visualizador, etc.)

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Roles disponibles en el sistema';
COMMENT ON COLUMN roles.name IS 'Nombre único del rol (ej: admin, user, viewer)';
COMMENT ON COLUMN roles.is_system_role IS 'Indica si es un rol del sistema que no puede ser eliminado';

-- ============================================================================
-- 3. TABLA DE PERMISOS
-- ============================================================================
-- Define los permisos específicos que pueden ser asignados

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE permissions IS 'Permisos específicos que pueden ser asignados a roles';
COMMENT ON COLUMN permissions.resource IS 'Recurso al que aplica el permiso (ej: device, user, group)';
COMMENT ON COLUMN permissions.action IS 'Acción permitida (ej: read, write, delete, manage)';

-- ============================================================================
-- 4. TABLA DE RELACIÓN ROLES-PERMISOS
-- ============================================================================
-- Relación muchos a muchos entre roles y permisos

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Relación muchos a muchos entre roles y permisos';

-- ============================================================================
-- 5. TABLA DE RELACIÓN USUARIOS-ROLES
-- ============================================================================
-- Relación muchos a muchos entre usuarios (profiles) y roles

CREATE TABLE IF NOT EXISTS user_roles (
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    PRIMARY KEY (profile_id, role_id)
);

COMMENT ON TABLE user_roles IS 'Relación muchos a muchos entre perfiles y roles';
COMMENT ON COLUMN user_roles.assigned_by IS 'ID del perfil que asignó este rol';

-- ============================================================================
-- 6. TABLA DE MAPEO TRACCAR USERS
-- ============================================================================
-- Mapea los usuarios de la plataforma con los usuarios de Traccar

CREATE TABLE IF NOT EXISTS traccar_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    traccar_user_id INTEGER NOT NULL UNIQUE,
    traccar_username VARCHAR(100),
    session_token TEXT,
    token_expires_at TIMESTAMPTZ,
    is_synced BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE traccar_users IS 'Mapeo entre usuarios de la plataforma y usuarios de Traccar';
COMMENT ON COLUMN traccar_users.traccar_user_id IS 'ID del usuario en Traccar';
COMMENT ON COLUMN traccar_users.session_token IS 'Token de sesión de Traccar para autenticación API';
COMMENT ON COLUMN traccar_users.token_expires_at IS 'Fecha y hora de expiración del token de sesión';
COMMENT ON COLUMN traccar_users.is_synced IS 'Indica si el usuario está sincronizado con Traccar';
COMMENT ON COLUMN traccar_users.sync_error IS 'Mensaje de error si la sincronización falló';

-- ============================================================================
-- 7. TABLA DE DISPOSITIVOS
-- ============================================================================
-- Almacena información de los dispositivos sincronizados desde Traccar

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    traccar_device_id INTEGER NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    unique_id VARCHAR(255) NOT NULL UNIQUE,
    model VARCHAR(100),
    status VARCHAR(50) DEFAULT 'offline',
    last_update TIMESTAMPTZ,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    speed DECIMAL(10, 2),
    course DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE devices IS 'Dispositivos de seguimiento sincronizados desde Traccar';
COMMENT ON COLUMN devices.traccar_device_id IS 'ID del dispositivo en Traccar';
COMMENT ON COLUMN devices.unique_id IS 'Identificador único del dispositivo (IMEI, etc.)';
COMMENT ON COLUMN devices.status IS 'Estado del dispositivo (online, offline, unknown)';
COMMENT ON COLUMN devices.metadata IS 'Información adicional del dispositivo en formato JSON';

-- ============================================================================
-- 8. TABLA DE RELACIÓN USUARIOS-DISPOSITIVOS
-- ============================================================================
-- Relación muchos a muchos entre usuarios y dispositivos

CREATE TABLE IF NOT EXISTS user_devices (
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    can_read BOOLEAN DEFAULT true,
    can_write BOOLEAN DEFAULT false,
    can_manage BOOLEAN DEFAULT false,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    PRIMARY KEY (profile_id, device_id)
);

COMMENT ON TABLE user_devices IS 'Relación muchos a muchos entre perfiles y dispositivos';
COMMENT ON COLUMN user_devices.can_read IS 'Permite leer información del dispositivo';
COMMENT ON COLUMN user_devices.can_write IS 'Permite modificar configuración del dispositivo';
COMMENT ON COLUMN user_devices.can_manage IS 'Permite gestionar completamente el dispositivo';

-- ============================================================================
-- 9. TABLA DE GRUPOS DE DISPOSITIVOS
-- ============================================================================
-- Grupos para organizar dispositivos

CREATE TABLE IF NOT EXISTS device_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    traccar_group_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE device_groups IS 'Grupos para organizar dispositivos';
COMMENT ON COLUMN device_groups.traccar_group_id IS 'ID del grupo en Traccar (puede ser NULL si no está sincronizado)';

-- ============================================================================
-- 10. TABLA DE RELACIÓN DISPOSITIVOS-GRUPOS
-- ============================================================================
-- Relación muchos a muchos entre dispositivos y grupos

CREATE TABLE IF NOT EXISTS device_group_members (
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES device_groups(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (device_id, group_id)
);

COMMENT ON TABLE device_group_members IS 'Relación muchos a muchos entre dispositivos y grupos';

-- ============================================================================
-- 11. TABLA DE RELACIÓN USUARIOS-GRUPOS
-- ============================================================================
-- Relación muchos a muchos entre usuarios y grupos de dispositivos

CREATE TABLE IF NOT EXISTS user_device_groups (
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES device_groups(id) ON DELETE CASCADE,
    can_read BOOLEAN DEFAULT true,
    can_write BOOLEAN DEFAULT false,
    can_manage BOOLEAN DEFAULT false,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    PRIMARY KEY (profile_id, group_id)
);

COMMENT ON TABLE user_device_groups IS 'Relación muchos a muchos entre perfiles y grupos de dispositivos';

-- ============================================================================
-- 12. TABLA DE LOG DE SINCRONIZACIÓN
-- ============================================================================
-- Registra las operaciones de sincronización con la API de Traccar

CREATE TABLE IF NOT EXISTS traccar_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sync_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    traccar_entity_id INTEGER,
    status VARCHAR(50) NOT NULL,
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE traccar_sync_log IS 'Registro de operaciones de sincronización con Traccar API';
COMMENT ON COLUMN traccar_sync_log.sync_type IS 'Tipo de sincronización (create, update, delete, sync)';
COMMENT ON COLUMN traccar_sync_log.entity_type IS 'Tipo de entidad (user, device, group)';
COMMENT ON COLUMN traccar_sync_log.status IS 'Estado de la operación (success, error, pending)';

-- ============================================================================
-- 13. FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Función para actualizar automáticamente el campo updated_at';

-- ============================================================================
-- 14. FUNCIÓN Y TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE
-- ============================================================================

-- Función para crear un perfil automáticamente cuando se crea un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar perfil solo si no existe ya (evita errores en caso de re-ejecución)
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS 'Crea automáticamente un perfil cuando se crea un nuevo usuario en auth.users';

-- Trigger que se ejecuta después de insertar un usuario en auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 15. TRIGGERS PARA ACTUALIZAR updated_at
-- ============================================================================

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traccar_users_updated_at
    BEFORE UPDATE ON traccar_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_groups_updated_at
    BEFORE UPDATE ON device_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 16. FUNCIONES AUXILIARES PARA RLS
-- ============================================================================

-- Función para obtener el profile_id del usuario autenticado
CREATE OR REPLACE FUNCTION user_profile_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_profile_id() IS 'Retorna el profile_id del usuario autenticado';

-- Función para verificar si un usuario tiene un rol específico
CREATE OR REPLACE FUNCTION user_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN profiles p ON ur.profile_id = p.id
        WHERE p.user_id = auth.uid()
        AND r.name = role_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_role(TEXT) IS 'Verifica si el usuario autenticado tiene un rol específico';

-- Función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN user_has_role('admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin() IS 'Verifica si el usuario autenticado es administrador';

-- Función para verificar si un usuario tiene acceso a un dispositivo
CREATE OR REPLACE FUNCTION user_has_device_access(device_uuid UUID, permission_type TEXT DEFAULT 'read')
RETURNS BOOLEAN AS $$
BEGIN
    -- Los administradores tienen acceso completo
    IF is_admin() THEN
        RETURN true;
    END IF;
    
    -- Verificar acceso directo al dispositivo
    RETURN EXISTS (
        SELECT 1
        FROM user_devices ud
        JOIN profiles p ON ud.profile_id = p.id
        WHERE p.user_id = auth.uid()
        AND ud.device_id = device_uuid
        AND (
            (permission_type = 'read' AND ud.can_read = true) OR
            (permission_type = 'write' AND ud.can_write = true) OR
            (permission_type = 'manage' AND ud.can_manage = true)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_device_access(UUID, TEXT) IS 'Verifica si el usuario tiene acceso a un dispositivo';

-- Función para verificar si un usuario tiene acceso a un grupo
CREATE OR REPLACE FUNCTION user_has_group_access(group_uuid UUID, permission_type TEXT DEFAULT 'read')
RETURNS BOOLEAN AS $$
BEGIN
    -- Los administradores tienen acceso completo
    IF is_admin() THEN
        RETURN true;
    END IF;
    
    -- Verificar acceso directo al grupo
    RETURN EXISTS (
        SELECT 1
        FROM user_device_groups udg
        JOIN profiles p ON udg.profile_id = p.id
        WHERE p.user_id = auth.uid()
        AND udg.group_id = group_uuid
        AND (
            (permission_type = 'read' AND udg.can_read = true) OR
            (permission_type = 'write' AND udg.can_write = true) OR
            (permission_type = 'manage' AND udg.can_manage = true)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_group_access(UUID, TEXT) IS 'Verifica si el usuario tiene acceso a un grupo de dispositivos';

-- ============================================================================
-- 17. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE traccar_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_device_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE traccar_sync_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 18. POLÍTICAS RLS PARA PROFILES
-- ============================================================================

-- Los usuarios pueden leer su propio perfil
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    USING (user_id = auth.uid());

-- Los usuarios pueden crear su propio perfil
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Los administradores pueden leer todos los perfiles
CREATE POLICY "Admins can read all profiles"
    ON profiles FOR SELECT
    USING (is_admin());

-- Los administradores pueden insertar perfiles
CREATE POLICY "Admins can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (is_admin());

-- Los administradores pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Los administradores pueden eliminar perfiles
CREATE POLICY "Admins can delete profiles"
    ON profiles FOR DELETE
    USING (is_admin());

-- ============================================================================
-- 19. POLÍTICAS RLS PARA ROLES
-- ============================================================================

-- Todos los usuarios autenticados pueden leer roles
CREATE POLICY "Authenticated users can read roles"
    ON roles FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Solo administradores pueden modificar roles
CREATE POLICY "Admins can manage roles"
    ON roles FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- 20. POLÍTICAS RLS PARA PERMISSIONS
-- ============================================================================

-- Todos los usuarios autenticados pueden leer permisos
CREATE POLICY "Authenticated users can read permissions"
    ON permissions FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Solo administradores pueden modificar permisos
CREATE POLICY "Admins can manage permissions"
    ON permissions FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- 21. POLÍTICAS RLS PARA ROLE_PERMISSIONS
-- ============================================================================

-- Todos los usuarios autenticados pueden leer role_permissions
CREATE POLICY "Authenticated users can read role_permissions"
    ON role_permissions FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Solo administradores pueden modificar role_permissions
CREATE POLICY "Admins can manage role_permissions"
    ON role_permissions FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- 22. POLÍTICAS RLS PARA USER_ROLES
-- ============================================================================

-- Los usuarios pueden leer sus propios roles
CREATE POLICY "Users can read own roles"
    ON user_roles FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Los administradores pueden leer todos los user_roles
CREATE POLICY "Admins can read all user_roles"
    ON user_roles FOR SELECT
    USING (is_admin());

-- Solo administradores pueden modificar user_roles
CREATE POLICY "Admins can manage user_roles"
    ON user_roles FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- 23. POLÍTICAS RLS PARA TRACCAR_USERS
-- ============================================================================

-- Los usuarios pueden leer su propio mapeo de Traccar
CREATE POLICY "Users can read own traccar_user"
    ON traccar_users FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Los administradores pueden leer todos los traccar_users
CREATE POLICY "Admins can read all traccar_users"
    ON traccar_users FOR SELECT
    USING (is_admin());

-- Los usuarios pueden insertar su propio mapeo de Traccar
CREATE POLICY "Users can insert own traccar_user"
    ON traccar_users FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Los usuarios pueden actualizar su propio mapeo de Traccar
CREATE POLICY "Users can update own traccar_user"
    ON traccar_users FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Solo administradores pueden eliminar traccar_users
CREATE POLICY "Admins can delete traccar_users"
    ON traccar_users FOR DELETE
    USING (is_admin());

-- Solo administradores pueden modificar traccar_users (para operaciones adicionales)
CREATE POLICY "Admins can manage traccar_users"
    ON traccar_users FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- 24. POLÍTICAS RLS PARA DEVICES
-- ============================================================================

-- Los usuarios pueden leer dispositivos a los que tienen acceso
CREATE POLICY "Users can read accessible devices"
    ON devices FOR SELECT
    USING (
        is_admin() OR
        EXISTS (
            SELECT 1
            FROM user_devices ud
            JOIN profiles p ON ud.profile_id = p.id
            WHERE p.user_id = auth.uid()
            AND ud.device_id = devices.id
            AND ud.can_read = true
        )
    );

-- Solo administradores pueden insertar dispositivos
CREATE POLICY "Admins can insert devices"
    ON devices FOR INSERT
    WITH CHECK (is_admin());

-- Solo administradores pueden actualizar dispositivos
CREATE POLICY "Admins can update devices"
    ON devices FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Solo administradores pueden eliminar dispositivos
CREATE POLICY "Admins can delete devices"
    ON devices FOR DELETE
    USING (is_admin());

-- ============================================================================
-- 25. POLÍTICAS RLS PARA USER_DEVICES
-- ============================================================================

-- Los usuarios pueden leer sus propias asignaciones de dispositivos
CREATE POLICY "Users can read own device assignments"
    ON user_devices FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Los administradores pueden leer todas las asignaciones
CREATE POLICY "Admins can read all device assignments"
    ON user_devices FOR SELECT
    USING (is_admin());

-- Solo administradores pueden modificar user_devices
CREATE POLICY "Admins can manage device assignments"
    ON user_devices FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- 26. POLÍTICAS RLS PARA DEVICE_GROUPS
-- ============================================================================

-- Los usuarios pueden leer grupos a los que tienen acceso
CREATE POLICY "Users can read accessible groups"
    ON device_groups FOR SELECT
    USING (
        is_admin() OR
        EXISTS (
            SELECT 1
            FROM user_device_groups udg
            JOIN profiles p ON udg.profile_id = p.id
            WHERE p.user_id = auth.uid()
            AND udg.group_id = device_groups.id
            AND udg.can_read = true
        )
    );

-- Solo administradores pueden modificar device_groups
CREATE POLICY "Admins can manage device_groups"
    ON device_groups FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- 27. POLÍTICAS RLS PARA DEVICE_GROUP_MEMBERS
-- ============================================================================

-- Los usuarios pueden leer miembros de grupos a los que tienen acceso
CREATE POLICY "Users can read accessible group members"
    ON device_group_members FOR SELECT
    USING (
        is_admin() OR
        EXISTS (
            SELECT 1
            FROM user_device_groups udg
            JOIN profiles p ON udg.profile_id = p.id
            WHERE p.user_id = auth.uid()
            AND udg.group_id = device_group_members.group_id
            AND udg.can_read = true
        )
    );

-- Solo administradores pueden modificar device_group_members
CREATE POLICY "Admins can manage group members"
    ON device_group_members FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- 28. POLÍTICAS RLS PARA USER_DEVICE_GROUPS
-- ============================================================================

-- Los usuarios pueden leer sus propias asignaciones de grupos
CREATE POLICY "Users can read own group assignments"
    ON user_device_groups FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Los administradores pueden leer todas las asignaciones
CREATE POLICY "Admins can read all group assignments"
    ON user_device_groups FOR SELECT
    USING (is_admin());

-- Solo administradores pueden modificar user_device_groups
CREATE POLICY "Admins can manage group assignments"
    ON user_device_groups FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- 29. POLÍTICAS RLS PARA TRACCAR_SYNC_LOG
-- ============================================================================

-- Los usuarios pueden leer sus propios logs de sincronización
CREATE POLICY "Users can read own sync logs"
    ON traccar_sync_log FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        ) OR profile_id IS NULL
    );

-- Los administradores pueden leer todos los logs
CREATE POLICY "Admins can read all sync logs"
    ON traccar_sync_log FOR SELECT
    USING (is_admin());

-- Solo administradores pueden insertar logs
CREATE POLICY "Admins can insert sync logs"
    ON traccar_sync_log FOR INSERT
    WITH CHECK (is_admin());

-- Solo administradores pueden eliminar logs
CREATE POLICY "Admins can delete sync logs"
    ON traccar_sync_log FOR DELETE
    USING (is_admin());

-- ============================================================================
-- 30. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Índices para roles
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system_role ON roles(is_system_role);

-- Índices para permissions
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

-- Índices para role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Índices para user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_profile_id ON user_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Índices para traccar_users
CREATE INDEX IF NOT EXISTS idx_traccar_users_profile_id ON traccar_users(profile_id);
CREATE INDEX IF NOT EXISTS idx_traccar_users_traccar_user_id ON traccar_users(traccar_user_id);
CREATE INDEX IF NOT EXISTS idx_traccar_users_is_synced ON traccar_users(is_synced);
CREATE INDEX IF NOT EXISTS idx_traccar_users_session_token ON traccar_users(session_token) WHERE session_token IS NOT NULL;

-- Índices para devices
CREATE INDEX IF NOT EXISTS idx_devices_traccar_device_id ON devices(traccar_device_id);
CREATE INDEX IF NOT EXISTS idx_devices_unique_id ON devices(unique_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_is_active ON devices(is_active);
CREATE INDEX IF NOT EXISTS idx_devices_last_update ON devices(last_update);

-- Índices para user_devices
CREATE INDEX IF NOT EXISTS idx_user_devices_profile_id ON user_devices(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);

-- Índices para device_groups
CREATE INDEX IF NOT EXISTS idx_device_groups_traccar_group_id ON device_groups(traccar_group_id);
CREATE INDEX IF NOT EXISTS idx_device_groups_name ON device_groups(name);
CREATE INDEX IF NOT EXISTS idx_device_groups_is_active ON device_groups(is_active);

-- Índices para device_group_members
CREATE INDEX IF NOT EXISTS idx_device_group_members_device_id ON device_group_members(device_id);
CREATE INDEX IF NOT EXISTS idx_device_group_members_group_id ON device_group_members(group_id);

-- Índices para user_device_groups
CREATE INDEX IF NOT EXISTS idx_user_device_groups_profile_id ON user_device_groups(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_device_groups_group_id ON user_device_groups(group_id);

-- Índices para traccar_sync_log
CREATE INDEX IF NOT EXISTS idx_traccar_sync_log_profile_id ON traccar_sync_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_traccar_sync_log_sync_type ON traccar_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_traccar_sync_log_entity_type ON traccar_sync_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_traccar_sync_log_status ON traccar_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_traccar_sync_log_created_at ON traccar_sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_traccar_sync_log_entity_type_entity_id ON traccar_sync_log(entity_type, entity_id);

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================



