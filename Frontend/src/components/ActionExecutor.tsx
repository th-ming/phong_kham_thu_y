import { toast } from './Toast';
import { confirmAction } from './ConfirmModal';
import { isSensitiveAction } from '../utils/agentCommandParser';

const escapeCssIdent = (value: string) => {
  const css = (window as any).CSS;
  if (css?.escape) return css.escape(value);
  return value.replace(/["\\\]\[]/g, '\\$&');
};

const getAiElement = <T extends HTMLElement = HTMLElement>(id: string): T | null => {
  return document.querySelector(`[data-ai-id="${escapeCssIdent(id)}"]`) as T | null;
};

const isSensitiveElement = (el: HTMLElement, payload: string) => {
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;

  const text = `${payload} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''} ${el.textContent || ''}`.toLowerCase();
  return isSensitiveAction(text);
};

/**
 * Execute a single AI action tag.
 * Supported tags: CLICK, FILL, TOGGLE, SELECT, DELETE, SCROLL
 */
export const executeAction = async (tag: string, skipConfirm: boolean = false) => {
  try {
    const match = tag.match(/^\[(CLICK|FILL|TOGGLE|SELECT|DELETE|SCROLL):([^\]]+)\]$/);
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
      default:
        break;
    }
  } catch (e) {
    console.error('Error executing AI action', e);
    toast.error('Có lỗi xảy ra khi AI thực thi hành động!');
    window.dispatchEvent(new CustomEvent('agent-action', {
      detail: { type: 'ERROR', tag: tag, message: 'Có lỗi hệ thống xảy ra!' }
    }));
  }
};
