import { toast } from './Toast';
import { confirmAction } from './ConfirmModal';

/**
 * Execute a single AI action tag.
 * Supported tags: CLICK, FILL, TOGGLE, SELECT, DELETE
 */
export const executeAction = async (tag: string) => {
  try {
    const match = tag.match(/^\[(CLICK|FILL|TOGGLE|SELECT|DELETE):([^\]]+)\]$/);
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

    // CƠ CHẾ AUTOPILOT: Tạo độ trễ ngẫu nhiên 600ms - 900ms để người dùng kịp nhìn thấy AI thao tác
    const delayMs = Math.floor(Math.random() * 300) + 600;
    await new Promise(resolve => setTimeout(resolve, delayMs));

    switch (type) {
      case 'CLICK': {
        const el = document.querySelector(`[data-ai-id="${payload}"]`) as HTMLElement;
        if (el) {
          triggerClickWithTag(el, `CLICK:${payload}`);
          toast.success(`Đã tự động Click vào: ${payload}`);
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'SUCCESS', tag, message: `Đã tự động Click vào: ${payload}` }
          }));
        } else {
          window.dispatchEvent(new CustomEvent('agent-action', {
            detail: { type: 'ERROR', tag, message: `Không tìm thấy phần tử để Click: ${payload}` }
          }));
        }
        break;
      }
      case 'FILL': {
        const [id, value] = payload.split('|');
        const input = document.querySelector(`[data-ai-id="${id}"]`) as HTMLInputElement;
        if (input) {
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
        const el = document.querySelector(`[data-ai-id="${payload}"]`) as HTMLElement;
        if (el) {
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
        const [id, option] = payload.split('|');
        const select = document.querySelector(`[data-ai-id="${id}"]`) as HTMLSelectElement;
        if (select) {
          const requestedOption = option?.trim();
          const firstValidOption = Array.from(select.options).find(opt => !opt.disabled && opt.value.trim() !== "");
          const optionToSelect = (!requestedOption || requestedOption === "__FIRST_VALID__")
            ? firstValidOption?.value
            : requestedOption;

          if (!optionToSelect) {
            window.dispatchEvent(new CustomEvent('agent-action', {
              detail: { type: 'ERROR', tag, message: `Không có lựa chọn hợp lệ trong danh mục: ${id}` }
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
        window.dispatchEvent(new CustomEvent('agent-action', {
          detail: { type: 'PROGRESS', tag, message: `Đang chờ sếp xác nhận lệnh XÓA: ${payload}` }
        }));
        const isConfirmed = await confirmAction(`AI đang cố gắng thực thi lệnh XÓA "${payload}". Bạn có chắc chắn muốn cho phép hành động này không?`);
        if (isConfirmed) {
          const el = document.querySelector(`[data-ai-id="${payload}"]`) as HTMLElement;
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
            detail: { type: 'ERROR', tag, message: `Sếp đã từ chối lệnh xóa: ${payload}` }
          }));
        }
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
