local json = dofile(reaper.GetResourcePath() .. "/Scripts/reascripts/RFX_Json.lua")

local M = {}

local function get_ipc_dir()
  return "/tmp/rfx-ipc"
end

local function write_file(path, text)
  local f = io.open(path, "w")
  if not f then return false end
  f:write(text or "")
  f:close()
  return true
end

local function append_file(path, text)
  local f = io.open(path, "a")
  if not f then return false end
  f:write(text or "")
  f:close()
  return true
end

local function now_ms()
  return math.floor(reaper.time_precise() * 1000)
end

local function log_export(msg)
  append_file(get_ipc_dir() .. "/installed_plugins_debug.log", "[" .. tostring(now_ms()) .. "] " .. tostring(msg) .. "\n")
end

local function trim(s)
  return tostring(s or ""):match("^%s*(.-)%s*$")
end

local function parse_fx_display_name(raw)
  raw = trim(raw)

  local formatPart, rest = raw:match("^([^:]+):%s*(.+)$")
  if not formatPart then
    return {
      id = raw,
      name = raw,
      vendor = "",
      format = "",
      raw = raw,
    }
  end

  local namePart, vendorPart = rest:match("^(.-)%s*%((.-)%)%s*$")
  if not namePart then
    namePart = rest
    vendorPart = ""
  end

  return {
    id = raw,
    name = trim(namePart),
    vendor = trim(vendorPart),
    format = trim(formatPart),
    raw = raw,
  }
end

local function safe_add(list, seen, raw)
  raw = trim(raw)
  if raw == "" then return end
  if seen[raw] then return end
  seen[raw] = true
  list[#list + 1] = parse_fx_display_name(raw)
end

function M.export_installed_plugins()
  log_export("export_installed_plugins() begin")

  local out = {}
  local seen = {}

  -- Preferred path: enumerate FX directly from REAPER's FX browser database
  -- This API is supported in modern REAPER builds.
  local i = 0
  while true do
    local ok, name = reaper.EnumInstalledFX(i)
    if not ok then break end
  
    if i < 200 then
      log_export("EnumInstalledFX[" .. tostring(i) .. "] = " .. tostring(name))
    end
  
    safe_add(out, seen, name)
    i = i + 1
  end

  table.sort(out, function(a, b)
    local an = string.lower(a.name or a.raw or "")
    local bn = string.lower(b.name or b.raw or "")
    if an == bn then
      return string.lower(a.raw or "") < string.lower(b.raw or "")
    end
    return an < bn
  end)

  local okEncode, encoded = pcall(json.encode, out)
  if not okEncode or not encoded then
    write_file(get_ipc_dir() .. "/installed_plugins_error.txt", "json.encode failed: " .. tostring(encoded))
    log_export("json.encode failed: " .. tostring(encoded))
    return false
  end

  local okWrite = write_file(get_ipc_dir() .. "/installed_plugins.json", encoded)
  if not okWrite then
    write_file(get_ipc_dir() .. "/installed_plugins_error.txt", "failed to write installed_plugins.json")
    log_export("failed to write installed_plugins.json")
    return false
  end

  write_file(get_ipc_dir() .. "/installed_plugins_ok.txt", "exported " .. tostring(#out) .. " plugins")
  log_export("export_installed_plugins() success count=" .. tostring(#out))
  return true
end

return M
