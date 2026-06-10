import { toast } from './Toast';
import { confirmAction } from './ConfirmModal';
import { isSensitiveAction } from '../utils/agentCommandParser';

const escapeCssIdent = (value: string) => {
  const css = (window as any).CSS;
  if (css?.escape) return css.escape(value);
  return value.replace(/["\\\]\[]/g, '\\$&');
};

const ACTION_ALIAS: Record<string, string[]> = {
  rexi_agent_tab: ["button-chatbot-jdzj"],
  chatbot_agent_tab: ["button-chatbot-jdzj"],
  btn_vnpay: ["button-hoadonthanhtoan-vnpay", "button-quanlyhoadon-9rt0", "button-ketoandashboard-mobile-pay"],
  input_service_name: ["input-quanlydichvu-9ned"],
  btn_add_service: ["btn_service_add", "button-quanlydichvu-xpbd"],
  btn_save_service: ["btn_service_save", "button-quanlydichvu-zqdb"],
  btn_save_pet: ["btn_pet_save", "button-quanlykhachhangthucung-czfa"],
  btn_export_pdf: ["button-quanlyhoadon-1v4i", "button-hoadonthanhtoan-qkgo"],
  btn_save_hsba: ["button-quanlybenhan-1pce", "button-quanlybenhan-save", "button-quanlybenhan-luu", "button-hosobenhan-save"],
  btn_open_camera: ["button-chatbot-veod"],
  btn_upload_file: ["button-chatbot-veod", "button-quanlyfiledinhkem-6hph"],
  btn_add_pet: ["button-quanlykhachhangthucung-324x", "btn_pet_add", "button-quanlykhachhangthucung-add-pet"],
  select_species: ["select_pet_species"],
  dropdown_doctor: ["select_appointment_doctor", "select-datlichhen-33v9"],
  textarea_symptom: ["textarea_symptom", "textarea-datlichhen-note", "textarea-quanlybenhan-trieuchung", "textarea-symptom"],
};

const getAiElement = <T extends HTMLElement = HTMLElement>(id: string): T | null => {
  const direct = document.querySelector(`[data-ai-id="${escapeCssIdent(id)}"]`) as T | null;
  if (direct) return direct;
  for (const alias of ACTION_ALIAS[id] || []) {
    const el = document.querySelector(`[data-ai-id="${escapeCssIdent(alias)}"]`) as T | null;
    if (el) return el;
  }
  return null;
};

const isSensitiveElement = (el: HTMLElement, payload: string) => {
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;

  const text = `${payload} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''} ${el.textContent || ''}`.toLowerCase();
  return isSensitiveAction(text);
};

const PREVIEW_STYLE_STORE = "__REXI_PREVIEW_STYLE_STORE__";
const PREVIEW_LINK_STORE = "__REXI_PREVIEW_LINK_STORE__";
const SAFE_PREVIEW_STYLE_PROPS = new Set([
  "background", "backgroundColor", "color", "borderColor", "boxShadow", "outline", "transform",
  "fontSize", "fontWeight", "padding", "margin", "borderRadius", "opacity", "display"
]);

const getPreviewStore = () => {
  const win = window as any;
  if (!win[PREVIEW_STYLE_STORE]) win[PREVIEW_STYLE_STORE] = new Map<string, Record<string, string>>();
  return win[PREVIEW_STYLE_STORE] as Map<string, Record<string, string>>;
};

const getPreviewLinkStore = () => {
  const win = window as any;
  if (!win[PREVIEW_LINK_STORE]) win[PREVIEW_LINK_STORE] = new Map<string, { parent: HTMLElement; node: HTMLElement }>();
  return win[PREVIEW_LINK_STORE] as Map<string, { parent: HTMLElement; node: HTMLElement }>;
};

const rememberPreviewStyle = (id: string, el: HTMLElement, prop: string) => {
  const store = getPreviewStore();
  const current = store.get(id) || {};
  if (!(prop in current)) {
    current[prop] = (el.style as any)[prop] || "";
    store.set(id, current);
  }
};

const isSafePreviewValue = (value: string) => {
  const v = value.trim().toLowerCase();
  if (!v || v.length > 80) return false;
  return !/[<>;{}]/.test(v) && !v.includes("javascript:") && !v.includes("url(") && !v.includes("expression(");
};

const highlightPreviewElement = (id: string, el: HTMLElement) => {
  rememberPreviewStyle(id, el, "outline");
  rememberPreviewStyle(id, el, "boxShadow");
  el.style.outline = "2px solid #22c55e";
  el.style.boxShadow = "0 0 0 4px rgba(34, 197, 94, 0.18), 0 12px 30px rgba(15, 23, 42, 0.16)";
};

/**
 * Execute a single AI action tag.
 * Supported tags: CLICK, FILL, TOGGLE, SELECT, DELETE, SCROLL, NAVIGATE, PREVIEW_STYLE, PREVIEW_TEXT, PREVIEW_LINK, PREVIEW_REMOVE_LINK, PREVIEW_RESET
 */
export const executeAction = async (tag: string, skipConfirm: boolean = false) => {
  try {
    const match = tag.match(/^\[(CLICK|FILL|TOGGLE|SELECT|DELETE|SCROLL|NAVIGATE|PREVIEW_STYLE|PREVIEW_TEXT|PREVIEW_LINK|PREVIEW_REMOVE_LINK|PREVIEW_RESET):([^\]]+)\]$/);
    if (!match) return;

    // Helper: Đính kèm thẻ tag vào window để Axios Interceptor có thể chộp lấy
    const triggerClickWithTag = (element: HTMLElement, fullTag: string) => {
      (window as any).__AI_ACTION_TAG__ = fullTag;
      element.click();
      setTimeout(() => { (window as any).__AI_ACTION_TAG__ = undefined; }, 500);
    };

    const [, type, payload] = match;

    // Phát sự kiện bắt đầu hành động
    window.dispatchEvent(new CustomEvent('agent-action', {
      detail: { type: 'START', tag, actionType: type, payload }
    }));

    switch (type) {
      case 'CLICK': {
        const el = getAiElement(payload);
        if (el) {
          if (!skipConfirm && isSensitiveElement(el, payload)) {
            const confirmed = await confirmAction(`AI đang chuẩn bị bấm phần tử nhạy cảm "${payload}". Bạn có chắc muốn cho phép không?`);
            if (!confirmed) {
              toast.info('Đã hủy thao tác nhạy cảm từ AI.');
              window.dispatchEvent(new CustomEvent('agent-action', {
                detail: { type: 'ERROR', tag, message: `Người dùng từ chối thao tác nhạy cảm: ${payload}` }
              }));
              break;
            }
          }
          triggerClickWithTag(el, `CLICK:${payload}`);
          toast.success(`Đã kích hoạt thao tác: ${payload}`);
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'SUCCESS', tag, message: `Đã kích hoạt thao tác: ${payload}` }
          }));
        } else {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Không tìm thấy phần tử để Click: ${payload}` }
          }));
        }
        break;
      }
      case 'FILL': {
        const separatorIdx = payload.includes('|') ? payload.indexOf('|') : payload.indexOf('=');
        const id = separatorIdx > -1 ? payload.slice(0, separatorIdx).trim() : payload;
        let value = separatorIdx > -1 ? payload.slice(separatorIdx + 1) : '';
        
        const input = getAiElement<HTMLInputElement>(id);
        if (input) {
          // Ngăn chặn bypass HTML5 Validation (giới hạn độ dài tối đa)
          const maxLength = input.getAttribute('maxlength');
          if (maxLength && value.length > Number(maxLength)) {
            value = value.slice(0, Number(maxLength));
          }
          const prototype = input instanceof HTMLTextAreaElement
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
          const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
          if (valueSetter) valueSetter.call(input, value);
          else input.value = value;
          (window as any).__AI_ACTION_TAG__ = `FILL:${payload}`;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          setTimeout(() => { (window as any).__AI_ACTION_TAG__ = undefined; }, 500);
          toast.success(`Đã tự động điền: ${value}`);
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'SUCCESS', tag, message: `Đã điền giá trị vào: ${id}` }
          }));
        } else {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Không tìm thấy ô nhập liệu: ${id}` }
          }));
        }
        break;
      }
      case 'TOGGLE': {
        const el = getAiElement(payload);
        if (el) {
          if (!skipConfirm && isSensitiveElement(el, payload)) {
            const confirmed = await confirmAction(`AI đang chuẩn bị đổi trạng thái phần tử nhạy cảm "${payload}". Bạn có chắc muốn cho phép không?`);
            if (!confirmed) {
              toast.info('Đã hủy thao tác nhạy cảm từ AI.');
              window.dispatchEvent(new CustomEvent('agent-action', {
                detail: { type: 'ERROR', tag, message: `Người dùng từ chối thao tác nhạy cảm: ${payload}` }
              }));
              break;
            }
          }
          triggerClickWithTag(el, `TOGGLE:${payload}`);
          toast.success(`Đã chuyển đổi trạng thái: ${payload}`);
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'SUCCESS', tag, message: `Đã chuyển đổi trạng thái: ${payload}` }
          }));
        } else {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Không tìm thấy phần tử để chuyển đổi: ${payload}` }
          }));
        }
        break;
      }
      case 'SELECT': {
        const separatorIdx = payload.includes('|') ? payload.indexOf('|') : payload.indexOf('=');
        const id = separatorIdx > -1 ? payload.slice(0, separatorIdx).trim() : payload.trim();
        const option = separatorIdx > -1 ? payload.slice(separatorIdx + 1) : '';
        const select = getAiElement<HTMLSelectElement>(id);
        if (select) {
          const requestedOption = option?.trim();
          const firstValidOption = Array.from(select.options).find(opt => !opt.disabled && opt.value.trim() !== "");
          const optionToSelect = (!requestedOption || requestedOption === "__FIRST_VALID__")
            ? firstValidOption?.value
            : requestedOption;

          const optionExists = Array.from(select.options).some(opt => opt.value === optionToSelect && !opt.disabled);
          if (!optionToSelect || !optionExists) {
            window.dispatchEvent(new CustomEvent('agent-action', {
              detail: { type: 'ERROR', tag, message: `Không có lựa chọn hợp lệ "${requestedOption || ''}" trong danh mục: ${id}` }
            }));
            break;
          }

          const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
          if (valueSetter) valueSetter.call(select, optionToSelect);
          else select.value = optionToSelect;
          (window as any).__AI_ACTION_TAG__ = `SELECT:${payload}`;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
          setTimeout(() => { (window as any).__AI_ACTION_TAG__ = undefined; }, 500);
          toast.success(`Đã chọn mục: ${optionToSelect}`);
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'SUCCESS', tag, message: `Đã chọn mục: ${optionToSelect} tại ${id}` }
          }));
        } else {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Không tìm thấy danh mục chọn: ${id}` }
          }));
        }
        break;
      }
      case 'DELETE': {
        // HÀNH ĐỘNG NHẠY CẢM: Bắt buộc gọi Modal xác nhận trước khi thực thi
        let isActionConfirmed = skipConfirm;
        if (!isActionConfirmed) {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'PROGRESS', tag, message: `Đang chờ xác nhận lệnh XÓA: ${payload}` }
          }));
          isActionConfirmed = await confirmAction(`AI đang cố gắng thực thi lệnh XÓA "${payload}". Bạn có chắc chắn muốn cho phép hành động này không?`);
        }
        if (isActionConfirmed) {
          const el = getAiElement(payload);
          if (el) {
            triggerClickWithTag(el, `DELETE:${payload}`);
            toast.success(`Đã xác nhận xóa: ${payload}`);
            window.dispatchEvent(new CustomEvent('agent-action', {
              detail: { type: 'SUCCESS', tag, message: `Đã xác nhận xóa phần tử: ${payload}` }
            }));
          } else {
            window.dispatchEvent(new CustomEvent('agent-action', {
              detail: { type: 'ERROR', tag, message: `Không tìm thấy phần tử để xóa: ${payload}` }
            }));
          }
        } else {
          toast.info('Đã hủy lệnh xóa từ AI.');
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Bạn đã từ chối lệnh xóa: ${payload}` }
          }));
        }
        break;
      }
      case 'SCROLL': {
        const normalizedPayload = payload.toLowerCase().trim();
        const [target, amountHint] = normalizedPayload.split('|').map(part => part.trim());
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 720;
        const amountByHint: Record<string, number> = {
          tiny: Math.round(viewportHeight * 0.2),
          small: Math.round(viewportHeight * 0.35),
          medium: Math.round(viewportHeight * 0.65),
          large: Math.round(viewportHeight * 0.9),
        };
        const parseAmount = (hint?: string) => {
          if (!hint) return amountByHint.small;
          if (amountByHint[hint]) return amountByHint[hint];
          const px = hint.match(/^(\d+)\s*px?$/);
          if (px) return Number(px[1]);
          const percent = hint.match(/^(\d+)\s*%$/);
          if (percent) return Math.round(viewportHeight * Number(percent[1]) / 100);
          return amountByHint.small;
        };

        if (target === 'top' || target === 'dau-trang' || target === 'dau trang') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (target === 'bottom' || target === 'cuoi-trang' || target === 'cuoi trang') {
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        } else if (target === 'up' || target === 'len') {
          window.scrollBy({ top: -parseAmount(amountHint), behavior: 'smooth' });
        } else if (target === 'down' || target === 'xuong') {
          window.scrollBy({ top: parseAmount(amountHint), behavior: 'smooth' });
        } else {
          const el = getAiElement(payload);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          } else {
            window.dispatchEvent(new CustomEvent('agent-action', {
              detail: { type: 'ERROR', tag, message: `Không tìm thấy vùng cần cuộn tới: ${payload}` }
            }));
            break;
          }
        }

        toast.success('Đã cuộn trang theo yêu cầu.');
        window.dispatchEvent(new CustomEvent('agent-action', {
          detail: { type: 'SUCCESS', tag, message: 'Đã cuộn trang theo yêu cầu.' }
        }));
        break;
      }
      case 'NAVIGATE': {
        const path = payload.trim();
        if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Đường dẫn điều hướng không hợp lệ: ${path}` }
          }));
          break;
        }
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
        toast.success(`Đã chuyển trang: ${path}`);
        window.dispatchEvent(new CustomEvent('agent-action', {
          detail: { type: 'SUCCESS', tag, message: `Đã chuyển trang: ${path}` }
        }));
        break;
      }
      case 'PREVIEW_STYLE': {
        const [idRaw, propRaw, ...valueParts] = payload.split('|');
        const id = (idRaw || '').trim();
        const prop = (propRaw || '').trim();
        const value = valueParts.join('|').trim();
        const el = getAiElement(id);
        if (!el || !SAFE_PREVIEW_STYLE_PROPS.has(prop) || !isSafePreviewValue(value)) {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Không thể chỉnh thử style an toàn: ${payload}` }
          }));
          break;
        }
        rememberPreviewStyle(id, el, prop);
        (el.style as any)[prop] = value;
        highlightPreviewElement(id, el);
        toast.success('Đã chỉnh thử giao diện. Reload trang sẽ mất.');
        window.dispatchEvent(new CustomEvent('agent-action', {
          detail: { type: 'SUCCESS', tag, message: `Đã preview style ${prop} cho ${id}` }
        }));
        break;
      }
      case 'PREVIEW_TEXT': {
        const separatorIdx = payload.indexOf('|');
        const id = separatorIdx > -1 ? payload.slice(0, separatorIdx).trim() : payload.trim();
        const value = separatorIdx > -1 ? payload.slice(separatorIdx + 1).trim() : '';
        const el = getAiElement(id);
        if (!el || !value || value.length > 80 || /[<>]/.test(value)) {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Không thể chỉnh thử chữ an toàn: ${payload}` }
          }));
          break;
        }
        const textKey = `${id}.__textContent`;
        const store = getPreviewStore();
        if (!store.has(textKey)) store.set(textKey, { value: el.textContent || '' });
        el.textContent = value;
        highlightPreviewElement(id, el);
        toast.success('Đã đổi thử chữ. Reload trang sẽ mất.');
        window.dispatchEvent(new CustomEvent('agent-action', {
          detail: { type: 'SUCCESS', tag, message: `Đã preview text cho ${id}` }
        }));
        break;
      }
      case 'PREVIEW_LINK': {
        const [parentRaw, labelRaw, ...urlParts] = payload.split('|');
        const parentSelector = (parentRaw || '').trim();
        const label = (labelRaw || '').trim();
        const href = urlParts.join('|').trim();
        const rawTarget = parentSelector === 'footer'
          ? document.querySelector('footer') as HTMLElement | null
          : parentSelector === 'header'
            ? document.querySelector('header') as HTMLElement | null
            : getAiElement<HTMLElement>(parentSelector);
        const parent = rawTarget && ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(rawTarget.tagName)
          ? rawTarget.parentElement as HTMLElement | null
          : rawTarget;
        if (!parent || !label || !href || href.length > 250 || /[<>\s]/.test(href)) {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Không thể thêm link an toàn: ${payload}` }
          }));
          break;
        }
        const normalizedHref = href.trim();
        if (!/^(https?:|mailto:|tel:|zalo:)/i.test(normalizedHref)) {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Chỉ cho phép link http/https/tel/mailto/zalo: ${payload}` }
          }));
          break;
        }
        const link = document.createElement('a');
        link.href = normalizedHref;
        link.textContent = label;
        link.target = normalizedHref.startsWith('tel:') || normalizedHref.startsWith('mailto:') ? '' : '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'inline-flex';
        link.style.alignItems = 'center';
        link.style.gap = '8px';
        link.style.margin = '6px 10px 0 0';
        link.style.padding = '8px 12px';
        link.style.borderRadius = '999px';
        link.style.background = 'rgba(255,255,255,0.08)';
        link.style.color = 'white';
        link.style.textDecoration = 'none';
        link.dataset.aiPreview = 'true';
        const previewId = `preview-link-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        link.dataset.aiPreviewId = previewId;
        parent.appendChild(link);
        getPreviewLinkStore().set(previewId, { parent, node: link });
        toast.success('Đã thêm thử link. Reload trang sẽ mất.');
        window.dispatchEvent(new CustomEvent('agent-action', {
          detail: { type: 'SUCCESS', tag, message: `Đã preview link: ${label}` }
        }));
        break;
      }
      case 'PREVIEW_REMOVE_LINK': {
        const target = payload.trim();
        const store = getPreviewLinkStore();
        const links = target === 'all' ? Array.from(store.values()) : [...store.values()].filter(item => item.node.dataset.aiPreviewId === target || item.node.textContent?.trim() === target || item.parent.dataset.aiId === target);
        if (links.length === 0) {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Không tìm thấy link preview để xóa: ${payload}` }
          }));
          break;
        }
        for (const item of links) {
          item.node.remove();
          const id = item.node.dataset.aiPreviewId;
          if (id) store.delete(id);
        }
        toast.success('Đã xóa link thử.');
        window.dispatchEvent(new CustomEvent('agent-action', {
          detail: { type: 'SUCCESS', tag, message: `Đã xóa preview link: ${payload}` }
        }));
        break;
      }
      case 'PREVIEW_RESET': {
        const id = payload.trim();
        const store = getPreviewStore();
        const ids = id === 'all' ? Array.from(store.keys()).map(key => key.replace(/\.__textContent$/, '')) : [id];
        for (const targetId of new Set(ids)) {
          const el = getAiElement(targetId);
          if (!el) continue;
          const saved = store.get(targetId);
          if (saved) {
            Object.entries(saved).forEach(([prop, value]) => { (el.style as any)[prop] = value; });
            store.delete(targetId);
          }
          const textSaved = store.get(`${targetId}.__textContent`);
          if (textSaved) {
            el.textContent = textSaved.value || '';
            store.delete(`${targetId}.__textContent`);
          }
        }
        const linkStore = getPreviewLinkStore();
        for (const { node } of Array.from(linkStore.values())) {
          if (id === 'all' || node.dataset.aiPreviewId?.startsWith(id)) {
            node.remove();
          }
        }
        if (id === 'all') linkStore.clear();
        toast.success('Đã hoàn tác chỉnh thử giao diện.');
        window.dispatchEvent(new CustomEvent('agent-action', {
          detail: { type: 'SUCCESS', tag, message: `Đã reset preview: ${id}` }
        }));
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('Error executing AI action', e);
    const detail = e instanceof Error ? e.message : '';
    toast.error(detail ? `Lỗi AI thực thi hành động: ${detail}` : 'Có lỗi xảy ra khi AI thực thi hành động!');
    window.dispatchEvent(new CustomEvent('agent-action', {
      detail: { type: 'ERROR', tag: tag, message: 'Có lỗi hệ thống xảy ra!' }
    }));
  }
};
