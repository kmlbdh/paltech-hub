import os
import server
from aiohttp import web

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

WEBROOT = os.path.join(os.path.dirname(os.path.realpath(__file__)), "web")

@server.PromptServer.instance.routes.get("/paltech-hub")
def deungeon_entrance(request):
    return web.FileResponse(os.path.join(WEBROOT, "index.html"))

server.PromptServer.instance.routes.static("/paltech/js/", path=os.path.join(WEBROOT, "js"))
server.PromptServer.instance.routes.static("/paltech/css/", path=os.path.join(WEBROOT, "css"))
server.PromptServer.instance.routes.static("/paltech/sources/", path=os.path.join(WEBROOT, "sources"))

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']

# Add this to your Python file to serve all files within WEBROOT under /paltech-hub/
@server.PromptServer.instance.routes.get("/paltech-hub/{tail:.*}")
async def serve_paltech_hub_files(request):
    # 'tail' will capture the rest of the path after /paltech-hub/
    filename = request.match_info.get('tail', 'index.html') # Default to index.html if no tail
    
    # Prevent directory traversal
    if '..' in filename or filename.startswith('/'):
        raise web.HTTPForbidden()

    filepath = os.path.join(WEBROOT, filename)

    if os.path.exists(filepath) and os.path.isfile(filepath):
        return web.FileResponse(filepath)
    
    # If the request is for the base URL /paltech-hub/ (no tail), serve index.html
    if not request.match_info.get('tail') and os.path.exists(os.path.join(WEBROOT, "index.html")):
        return web.FileResponse(os.path.join(WEBROOT, "index.html"))

    raise web.HTTPNotFound()

# Ensure your existing /paltech-hub route is removed or this new one is placed after it
# If you keep the specific /paltech-hub route, ensure it's handled correctly
# For simplicity, you might replace your existing @server.PromptServer.instance.routes.get("/paltech-hub")
# with the more generic one above, as it also handles the root of /paltech-hub.