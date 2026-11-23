package br.com.crithit.api.ai;

public class AiNonRetryableException extends RuntimeException {
    public AiNonRetryableException(String message) {
        super(message);
    }
    public AiNonRetryableException(String message, Throwable cause) {
        super(message, cause);
    }
}
