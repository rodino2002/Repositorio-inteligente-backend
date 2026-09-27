// import app from "./app";

// export default app;

import app from "./app";
import { httpServerHandler } from "cloudflare:node";

app.listen(3000);

export default httpServerHandler({ port: 3000 });