"""
emotion_model.py
----------------
Custom model classes for the audEERING dimensional emotion model:
  audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim

This model is NOT a standard transformers AutoModel — it ships custom
head/pooling code. These classes reproduce the model card exactly so the
weights load correctly. Output = arousal, dominance, valence (in that order),
each roughly in [0, 1]. The model also exposes the pooled hidden states as
a general-purpose emotional embedding.
"""

import torch
import torch.nn as nn
from transformers import Wav2Vec2Processor
from transformers.models.wav2vec2.modeling_wav2vec2 import (
    Wav2Vec2Model,
    Wav2Vec2PreTrainedModel,
)


class RegressionHead(nn.Module):
    """Classification/regression head on top of the pooled hidden state."""

    def __init__(self, config):
        super().__init__()
        self.dense = nn.Linear(config.hidden_size, config.hidden_size)
        self.dropout = nn.Dropout(config.final_dropout)
        self.out_proj = nn.Linear(config.hidden_size, config.num_labels)

    def forward(self, features, **kwargs):
        x = features
        x = self.dropout(x)
        x = self.dense(x)
        x = torch.tanh(x)
        x = self.dropout(x)
        x = self.out_proj(x)
        return x


class EmotionModel(Wav2Vec2PreTrainedModel):
    """Wav2Vec2 backbone (pruned to 12 layers) + regression head -> A/D/V."""

    # Some transformers versions expect these attrs during weight init/tying.
    # Newer versions call .keys() on all_tied_weights_keys, so these must be
    # dicts (not lists) to remain compatible.
    _tied_weights_keys = {}
    all_tied_weights_keys = {}

    def __init__(self, config):
        super().__init__(config)
        self.config = config
        self.wav2vec2 = Wav2Vec2Model(config)
        self.classifier = RegressionHead(config)
        # init_weights() can fail across transformers versions due to weight
        # tying hooks; guard it. Loading a pretrained checkpoint overwrites
        # these weights anyway, so a failed tie on random init is harmless.
        try:
            self.init_weights()
        except AttributeError:
            self.post_init() if hasattr(self, "post_init") else None

    def forward(self, input_values):
        outputs = self.wav2vec2(input_values)
        hidden_states = outputs[0]
        # Mean-pool over the time axis -> one vector per clip
        hidden_states = torch.mean(hidden_states, dim=1)
        logits = self.classifier(hidden_states)
        # Return BOTH the pooled embedding and the A/D/V scores
        return hidden_states, logits


def load_emotion_model(
    model_name="audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim", device="cpu"
):
    """Load processor + model once, return (processor, model, device)."""
    processor = Wav2Vec2Processor.from_pretrained(model_name)
    model = EmotionModel.from_pretrained(model_name).to(device).eval()
    return processor, model, device
