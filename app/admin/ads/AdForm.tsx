'use client';

import { useActionState, useState } from 'react';
import type { CreateHomeAdResult, PostSearchItem } from './actions';
import { searchPostsForAd } from './actions';

type AdFormProps = {
  action: (formData: FormData) => Promise<CreateHomeAdResult>;
  initial?: {
    kind: string;
    postId: number | null;
    image: string;
    title: string;
    description: string;
    href: string;
    order: number;
  };
  submitLabel?: string;
  adId?: number;
};

export default function AdForm({ action, initial, submitLabel = '등록', adId }: AdFormProps) {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await action(formData);
      if (result.success) return null;
      return result.error;
    },
    null as string | null
  );

  const isEdit = adId != null;
  const [kind, setKind] = useState<'CLASS' | 'ETC'>(() =>
    initial?.kind === 'CLASS' ? 'CLASS' : 'ETC'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PostSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostSearchItem | null>(() =>
    initial?.kind === 'CLASS' && initial?.postId
      ? { id: initial.postId, title: initial.title, firstImageUrl: initial.image }
      : null
  );

  async function handleSearch() {
    setSearching(true);
    try {
      const list = await searchPostsForAd(searchQuery);
      setSearchResults(list);
    } finally {
      setSearching(false);
    }
  }

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {adId != null && <input type="hidden" name="id" value={adId} />}
      <input type="hidden" name="kind" value={kind} />
      {kind === 'CLASS' && selectedPost && (
        <input type="hidden" name="postId" value={selectedPost.id} />
      )}

      {state && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {state}
        </div>
      )}

      {/* 종류: 수업 / 기타 */}
      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">종류</span>
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="kindRadio"
              value="CLASS"
              checked={kind === 'CLASS'}
              onChange={() => {
                setKind('CLASS');
                setSelectedPost(
                  initial?.kind === 'CLASS' && initial?.postId
                    ? { id: initial.postId, title: initial.title, firstImageUrl: initial.image }
                    : null
                );
                setSearchResults([]);
              }}
              className="h-4 w-4"
            />
            <span>수업</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="kindRadio"
              value="ETC"
              checked={kind === 'ETC'}
              onChange={() => setKind('ETC')}
              className="h-4 w-4"
            />
            <span>기타</span>
          </label>
        </div>
      </div>

      {kind === 'CLASS' ? (
        /* 수업 선택: 검색 + 목록 + 선택 */
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-sm font-medium text-gray-700">수업 선택</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              placeholder="제목, 본문, 강사명으로 검색"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              수업 검색
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded border border-gray-200 bg-white">
              <ul className="divide-y divide-gray-100">
                {searchResults.map((post) => (
                  <li key={post.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPost(post);
                        setSearchResults([]);
                        setSearchQuery('');
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-slate-200">
                        {post.firstImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={post.firstImageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-gray-400">
                            없음
                          </span>
                        )}
                      </div>
                      <span className="truncate text-sm font-medium text-gray-900">
                        {post.title}
                      </span>
                      <span className="text-xs text-gray-500">ID: {post.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedPost && (
            <div className="rounded border border-green-200 bg-green-50/50 p-3">
              <p className="text-xs text-gray-500 mb-1">선택한 수업 (이미지는 해당 수업의 첫 번째 이미지로 노출됩니다)</p>
              <div className="flex items-center gap-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-slate-200">
                  {selectedPost.firstImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedPost.firstImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-gray-400">
                      이미지 없음
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{selectedPost.title}</p>
                  <p className="text-xs text-gray-500">/posts/{selectedPost.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                >
                  선택 해제
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 기타: 이미지 업로드 + 링크 */
        <>
          <div>
            <label htmlFor="image" className="mb-1 block text-sm font-medium text-gray-700">
              이미지 {!isEdit && <span className="text-red-500">*</span>}
            </label>
            {isEdit && initial?.image && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">현재 이미지</p>
                <div className="relative h-24 w-40 overflow-hidden rounded border border-gray-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={initial.image} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
            )}
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm"
              required={!isEdit}
            />
            {isEdit && (
              <p className="mt-1 text-xs text-gray-500">
                수정 시에만 새 파일을 선택하세요. 비우면 기존 이미지를 유지합니다.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="href" className="mb-1 block text-sm font-medium text-gray-700">
              링크 <span className="text-red-500">*</span>
            </label>
            <input
              id="href"
              name="href"
              type="text"
              defaultValue={initial?.href}
              placeholder="/posts 또는 https://..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required={kind === 'ETC'}
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initial?.title}
          placeholder={kind === 'CLASS' && selectedPost ? selectedPost.title : undefined}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          설명
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={initial?.description}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="order" className="mb-1 block text-sm font-medium text-gray-700">
          노출 순서 (작을수록 먼저)
        </label>
        <input
          id="order"
          name="order"
          type="number"
          defaultValue={initial?.order ?? 0}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
