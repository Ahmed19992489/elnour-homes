import React, { useState } from "react";
import { Star, Send, CheckCircle2, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface ReviewSectionProps {
  productId: number;
  title?: string;
}

export default function ReviewSection({ productId, title }: ReviewSectionProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");

  const { data: reviews, refetch } = trpc.reviews.byProduct.useQuery({ productId });

  const submitReview = trpc.reviews.submit.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال تقييمك بنجاح! سيظهر بعد المراجعة.");
      setAuthorName("");
      setContent("");
      setRating(5);
      void refetch();
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء إرسال التقييم");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) {
      toast.error("يرجى كتابة اسمك ورأيك");
      return;
    }
    submitReview.mutate({
      productId,
      authorName: authorName.trim(),
      rating,
      content: content.trim(),
    });
  };

  return (
    <div className="space-y-8 pt-8">
      <div className="flex items-center justify-between border-b border-[#e8e2d8] pb-4">
        <h3 className="text-xl font-bold text-[#24211d]">
          آراء وتقييمات العملاء {reviews?.length ? `(${reviews.length})` : ""}
        </h3>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {reviews && reviews.length > 0 ? (
          reviews.map((r: any) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[#eee8dd] bg-white p-5 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d5af58]/15 text-[#a8822d] font-bold text-sm">
                    {r.authorName?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[#24211d] block">
                      {r.authorName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < r.rating ? "fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-[#4a433a] leading-relaxed pr-11">
                {r.content}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#ddd6c8] bg-white/50 p-8 text-center text-sm text-muted-foreground">
            كن أول من يكتب تقييماً لهذا المنتج الفاخر!
          </div>
        )}
      </div>

      {/* Write a review form */}
      <div className="rounded-2xl border border-[#e8e2d8] bg-white p-6 shadow-xs">
        <h4 className="font-bold text-base text-[#24211d] mb-4">
          أضف رأيك وتجربتك
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#5c5448] block mb-1.5">
              تقييمك بالنجوم:
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-amber-500 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoverRating || rating)
                        ? "fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#5c5448] block mb-1">
                الاسم الكريم:
              </label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="مثال: المهندس أحمد سالم"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#5c5448] block mb-1">
              تفاصيل التقييم والرأي:
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب انطباعك عن جودة الاستيل والتشطيب والتعامل..."
              rows={3}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitReview.isPending}
            className="bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold rounded-xl"
          >
            <Send className="ml-2 h-4 w-4" />
            {submitReview.isPending ? "جاري الإرسال..." : "إرسال التقييم"}
          </Button>
        </form>
      </div>
    </div>
  );
}
