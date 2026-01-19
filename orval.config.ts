import axios from "axios";
import { defineConfig } from "orval";
import baseConfig from "./src/configs/base";

const orvalConfig = async () => {
  const { backendDomain, frontendDomain } = baseConfig;

  // 1. Lấy dữ liệu Swagger từ Backend
  const [caseSmeqBESwagger] = await Promise.all([
    axios.get(`${backendDomain}/swagger-output.json`, {
      headers: { Origin: frontendDomain },
    }),
  ]);

  // KIỂM TRA BẢO VỆ: Nếu Backend trả về tags trống, Orval mode 'tags' sẽ lỗi.
  // Chúng ta sẽ "bơm" một tag mặc định vào các path nếu chúng chưa có tag.
  const swaggerData = caseSmeqBESwagger.data;

  if (swaggerData.paths) {
    Object.keys(swaggerData.paths).forEach((path) => {
      const methods = swaggerData.paths[path];
      Object.keys(methods).forEach((method) => {
        // Nếu API chưa có tags, gán cho nó tag 'Default' để Orval không bị null
        if (!methods[method].tags || methods[method].tags.length === 0) {
          methods[method].tags = ["Default"];
        }
      });
    });
  }

  return defineConfig({
    "case-smeq-be": {
      output: {
        mode: "tags",
        target: "src/api/endpoints",
        schemas: "src/api/models",
        client: "react-query",
        override: {
          query: {
            useQuery: true,
            useInfinite: true,
            useInfiniteQueryParam: "page",
          },
          mutator: {
            path: "src/api/mutator/custom-instance.ts",
            name: "mainInstance",
          },
          header: () => "/* eslint-disable */\r\n",
          operations: {
            postSystemBackup: {
              mutator: {
                path: "src/api/mutator/fetch-instance.ts",
                name: "fetchInstance",
              },
            },
          },
        },
      },
      input: {
        target: swaggerData, // Truyền dữ liệu đã được xử lý tag ở trên
        filters: {
          // Chỉnh lại filter: Nếu Backend chưa có tag 'Authentication',
          // hãy thêm 'Default' vào đây để nó sinh ra code.
          tags: ["Authentication", "Default", /(((Library)|(Module)) - )?/],
        },
      },
    },
  });
};

export default orvalConfig;
