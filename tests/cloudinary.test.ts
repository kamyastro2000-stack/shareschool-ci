import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("cloudinary", () => {
  const mockUploadStream = {
    end: vi.fn(),
  };
  const mockDestroy = vi.fn().mockResolvedValue(undefined);

  return {
    v2: {
      config: vi.fn(),
      uploader: {
        upload_stream: vi.fn((_opts, callback) => {
          callback(null, {
            secure_url: "https://res.cloudinary.com/test/image/upload/v1/test",
            public_id: "shareschool/test-image",
          });
          return mockUploadStream;
        }),
        destroy: mockDestroy,
      },
    },
  };
});

describe("cloudinary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads a buffer and returns url + publicId", async () => {
    const { uploadToCloudinary } = await import("../src/lib/cloudinary");
    const buffer = Buffer.from("fake-image-data");
    const result = await uploadToCloudinary(buffer, "test-image.png");
    expect(result.url).toBe("https://res.cloudinary.com/test/image/upload/v1/test");
    expect(result.publicId).toBe("shareschool/test-image");
  });

  it("deletes by publicId", async () => {
    const { deleteFromCloudinary } = await import("../src/lib/cloudinary");
    await deleteFromCloudinary("shareschool/test-image");
    const cloudinary = await import("cloudinary");
    expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith("shareschool/test-image");
  });
});
