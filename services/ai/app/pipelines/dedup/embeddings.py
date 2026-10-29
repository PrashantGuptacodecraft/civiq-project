import math
import re
import zlib
from abc import ABC, abstractmethod


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity between two float vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b, strict=True))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return max(0.0, min(1.0, dot_product / (norm_a * norm_b)))


class BaseTextEmbedder(ABC):
    """Abstract interface for text embedding models."""

    @abstractmethod
    def embed(self, text: str) -> list[float]:
        """Convert string to normalized embedding vector."""
        pass

    def similarity(self, vec_a: list[float], vec_b: list[float]) -> float:
        """Compute semantic similarity between two embedding vectors."""
        return _cosine_similarity(vec_a, vec_b)


class DenseNgramSemanticEmbedder(BaseTextEmbedder):
    """
    Fast, deterministic dense semantic subword n-gram embedder.
    Maps word tokens and character trigrams into a normalized hash vector space.
    Captures lexical roots, morphological variations, compounding, and spelling typos
    without requiring heavy external neural dependencies in baseline mode.
    """

    def __init__(self, dimension: int = 256) -> None:
        self.dimension = dimension

    def _hash(self, token: str) -> int:
        return zlib.crc32(token.encode("utf-8")) % self.dimension

    def _clean_text(self, text: str) -> str:
        clean = re.sub(r"[^\w\s]", " ", text.lower())
        return " ".join(clean.split())

    def embed(self, text: str) -> list[float]:
        clean = self._clean_text(text)
        if not clean:
            return [0.0] * self.dimension

        vector = [0.0] * self.dimension
        words = clean.split()

        # 1. Unigram word features with log frequency
        for word in words:
            idx = self._hash(word)
            vector[idx] += 2.0

        # 2. Bigram phrases for local context
        for i in range(len(words) - 1):
            bigram = f"{words[i]}_{words[i + 1]}"
            idx = self._hash(bigram)
            vector[idx] += 3.0

        # 3. Subword character trigrams for typo resilience & root matching
        for word in words:
            padded = f"<{word}>"
            for j in range(len(padded) - 2):
                tri = padded[j : j + 3]
                idx = self._hash(tri)
                vector[idx] += 0.5

        # L2 Normalize
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0.0:
            vector = [v / norm for v in vector]

        return vector


class BaseImageEmbedder(ABC):
    """Abstract interface for image embeddings and perceptual hashing."""

    @abstractmethod
    def hash_similarity(self, hash_a: str, hash_b: str) -> float:
        """Compute similarity between two perceptual hash strings [0.0 to 1.0]."""
        pass

    @abstractmethod
    def vector_similarity(self, vec_a: list[float], vec_b: list[float]) -> float:
        """Compute cosine similarity between dense image embedding vectors."""
        pass


class PerceptualHashEmbedder(BaseImageEmbedder):
    """
    Perceptual hash matcher using bitwise Hamming distance across
    hexadecimal or binary image fingerprints (pHash, dHash, aHash).
    """

    def hash_similarity(self, hash_a: str, hash_b: str) -> float:
        if not hash_a or not hash_b:
            return 0.0

        strip_a = hash_a.strip().lower()
        strip_b = hash_b.strip().lower()

        # Both must be valid non-empty hexadecimal representations
        if not re.fullmatch(r"[0-9a-f]+", strip_a) or not re.fullmatch(r"[0-9a-f]+", strip_b):
            return 0.0

        clean_a = strip_a
        clean_b = strip_b

        # Compare common length
        compare_len = min(len(clean_a), len(clean_b))
        if compare_len == 0:
            return 0.0

        total_bits = compare_len * 4
        diff_bits = 0

        for ca, cb in zip(clean_a[:compare_len], clean_b[:compare_len], strict=True):
            val_a = int(ca, 16)
            val_b = int(cb, 16)
            xor_val = val_a ^ val_b
            # count differing bits
            diff_bits += bin(xor_val).count("1")

        similarity = max(0.0, 1.0 - (diff_bits / total_bits))
        return round(similarity, 4)

    def vector_similarity(self, vec_a: list[float], vec_b: list[float]) -> float:
        return _cosine_similarity(vec_a, vec_b)


# Default global singleton embedders
default_text_embedder = DenseNgramSemanticEmbedder()
default_image_embedder = PerceptualHashEmbedder()
