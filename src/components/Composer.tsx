'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { ImageSquare, LockSimple, Globe, X } from '@phosphor-icons/react/dist/ssr'
import { createPostAction, type PostFormState } from '@/actions/posts'

const initialState: PostFormState = { error: '', ok: false }
const MAX_IMAGES = 9

type Preview = { url: string; name: string }

export function Composer() {
	const [state, action, pending] = useActionState(createPostAction, initialState)
	const [previews, setPreviews] = useState<Preview[]>([])
	const [charCount, setCharCount] = useState(0)
	const fileRef = useRef<HTMLInputElement>(null)
	// 发布成功后清空预览与计数并重挂载表单
	const [key, setKey] = useState(0)
	useEffect(() => {
		if (state.ok) {
			clearPreviews()
			setCharCount(0)
			setKey(k => k + 1)
		}
	}, [state.ok])

	function clearPreviews() {
		setPreviews(prev => {
			for (const p of prev) URL.revokeObjectURL(p.url)
			return []
		})
		if (fileRef.current) fileRef.current.value = ''
	}

	function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
		const input = e.target
		const files = Array.from(input.files ?? [])
		setPreviews(prev => {
			for (const p of prev) URL.revokeObjectURL(p.url)
			return files.map(f => ({ url: URL.createObjectURL(f), name: f.name }))
		})
	}

	function removePreview(index: number) {
		const input = fileRef.current
		if (!input) return
		const kept = Array.from(input.files ?? []).filter((_, i) => i !== index)
		const dt = new DataTransfer()
		for (const f of kept) dt.items.add(f)
		input.files = dt.files
		setPreviews(prev => {
			URL.revokeObjectURL(prev[index].url)
			return prev.filter((_, i) => i !== index)
		})
	}

	return (
		<form key={key} action={action} className='composer card rise'>
			<textarea
				name='content'
				rows={3}
				maxLength={2000}
				placeholder='分享一刻…支持 #标签# 和链接'
				onChange={e => setCharCount(e.target.value.length)}
			/>
			{previews.length > 0 && (
				<div className='preview-grid'>
					{previews.map((p, i) => (
						<div key={p.url} className='preview-item'>
							<img src={p.url} alt={p.name} />
							<button type='button' className='preview-del' onClick={() => removePreview(i)} aria-label='移除这张图片'>
								<X size={11} weight='bold' />
							</button>
						</div>
					))}
				</div>
			)}
			{state.error && <p className='form-error'>{state.error}</p>}
			{state.ok && <p className='form-ok'>已发布</p>}
			<div className='composer-bar'>
				<label className='file-btn'>
					<ImageSquare size={17} />
					<span>{previews.length > 0 ? `${previews.length}/${MAX_IMAGES}` : '图片'}</span>
					<input ref={fileRef} type='file' name='images' accept='image/*' multiple onChange={onFiles} />
				</label>
				{charCount > 1800 && <span className='char-count'>{charCount}/2000</span>}
				<div className='seg'>
					<label>
						<input type='radio' name='visibility' value='public' defaultChecked />
						<span className='seg-opt'>
							<Globe size={13} weight='fill' />
							公开
						</span>
					</label>
					<label>
						<input type='radio' name='visibility' value='private' />
						<span className='seg-opt'>
							<LockSimple size={13} weight='fill' />
							仅自己
						</span>
					</label>
				</div>
				<button type='submit' className='btn btn-primary' disabled={pending}>
					{pending ? '发布中…' : '发布'}
				</button>
			</div>
		</form>
	)
}
